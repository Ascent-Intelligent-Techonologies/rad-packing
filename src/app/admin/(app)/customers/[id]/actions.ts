"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/crm/forms";
import { logActivity } from "@/lib/crm/activity";
import { requireUser } from "@/lib/crm/auth";
import { MANUAL_ACTIVITY_KINDS, TASK_KINDS } from "@/lib/crm/constants";
import { fromDateTimeInput, text } from "@/lib/crm/format";
import { getDb } from "@/lib/db";

function refresh(companyId: string) {
  revalidatePath(`/admin/customers/${companyId}`);
  revalidatePath("/admin/customers");
  revalidatePath("/admin/tasks");
}

/** Add a manual timeline entry (note / call / email / …) to a customer. */
export async function addNote(companyId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const company = await db.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) return { error: "This customer no longer exists." };

  const kind = String(fd.get("kind") ?? "note");
  if (!MANUAL_ACTIVITY_KINDS.some((k) => k.id === kind)) return { error: "Choose a valid entry type." };
  const body = text(fd.get("body"));
  if (!body) return { error: "Write something first." };
  if (body.length > 5000) return { error: "That note is too long (max 5,000 characters)." };

  let contactId = text(fd.get("contactId"));
  if (contactId) {
    const c = await db.contact.findFirst({ where: { id: contactId, companyId }, select: { id: true } });
    if (!c) contactId = null;
  }

  await logActivity({ kind, body, companyId, contactId, authorId: user.id });
  refresh(companyId);
  return { ok: true, message: "Added to the timeline." };
}

/** Quick-add a follow-up task for a customer. */
export async function addTask(companyId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const company = await db.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) return { error: "This customer no longer exists." };

  const title = text(fd.get("title"));
  if (!title) return { error: "Give the task a title." };
  if (title.length > 200) return { error: "The title is too long (max 200 characters)." };

  const kind = String(fd.get("kind") ?? "follow_up");
  if (!TASK_KINDS.some((k) => k.id === kind)) return { error: "Choose a valid task type." };

  const dueRaw = text(fd.get("dueAt"));
  const dueAt = fromDateTimeInput(dueRaw);
  if (dueRaw && !dueAt) return { error: "That due date doesn't look right." };

  let assigneeId = text(fd.get("assigneeId")) ?? user.id;
  const assignee = await db.user.findFirst({ where: { id: assigneeId, active: true }, select: { id: true } });
  if (!assignee) assigneeId = user.id;

  await db.task.create({ data: { title, kind, dueAt, assigneeId, companyId } });
  refresh(companyId);
  return { ok: true, message: "Task added." };
}

/** Mark a task done and note it on the customer's timeline. */
export async function completeTask(taskId: string): Promise<void> {
  const user = await requireUser("write");
  const db = getDb()!;
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, companyId: true, leadId: true, completedAt: true },
  });
  if (!task || task.completedAt) return;

  await db.task.update({ where: { id: taskId }, data: { completedAt: new Date() } });
  if (task.companyId) {
    await logActivity({ kind: "system", body: `Task completed: ${task.title}`, companyId: task.companyId, authorId: user.id });
    refresh(task.companyId);
  }
  if (task.leadId) revalidatePath(`/admin/enquiries/${task.leadId}`);
  revalidatePath("/admin");
}
