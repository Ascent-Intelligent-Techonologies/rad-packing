"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { PRIORITIES, TASK_KINDS } from "@/lib/crm/constants";
import { fromDateTimeInput, text } from "@/lib/crm/format";
import { logActivity } from "@/lib/crm/activity";
import type { ActionState } from "@/components/crm/forms";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

type Parsed =
  | { error: string }
  | {
      title: string;
      notes: string | null;
      kind: string;
      priority: string;
      dueAt: Date | null;
      assigneeId: string | null;
      companyId: string | null;
    };

/** Shared validation for create + edit. */
async function parseTask(fd: FormData, meId: string, keepAssigneeId?: string | null): Promise<Parsed> {
  const db = getDb()!;
  const title = str(fd.get("title"));
  if (!title) return { error: "Give the task a title." };
  if (title.length > 200) return { error: "The title is too long (200 characters max)." };

  const notes = text(fd.get("notes"));
  if (notes && notes.length > 4000) return { error: "The notes are too long (4000 characters max)." };

  const kind = str(fd.get("kind")) || "follow_up";
  if (!TASK_KINDS.some((k) => k.id === kind)) return { error: "Choose a valid task type." };
  const priority = str(fd.get("priority")) || "normal";
  if (!PRIORITIES.some((p) => p.id === priority)) return { error: "Choose a valid priority." };

  const dueRaw = str(fd.get("dueAt"));
  const dueAt = fromDateTimeInput(dueRaw);
  if (dueRaw && !dueAt) return { error: "That due date isn't valid." };

  const assigneeRaw = str(fd.get("assigneeId"));
  let assigneeId: string | null = null;
  if (assigneeRaw === "") assigneeId = null;
  else {
    const a = await db.user.findUnique({ where: { id: assigneeRaw === "me" ? meId : assigneeRaw }, select: { id: true, active: true } });
    // An existing assignee who has since been deactivated may stay on the task until it is reassigned.
    if (!a || (!a.active && a.id !== keepAssigneeId)) return { error: "Choose an active team member to assign this to." };
    assigneeId = a.id;
  }

  const companyRaw = str(fd.get("companyId"));
  let companyId: string | null = null;
  if (companyRaw) {
    const c = await db.company.findUnique({ where: { id: companyRaw }, select: { id: true } });
    if (!c) return { error: "That customer no longer exists." };
    companyId = c.id;
  }

  return { title, notes, kind, priority, dueAt, assigneeId, companyId };
}

export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const parsed = await parseTask(fd, user.id);
  if ("error" in parsed) return { error: parsed.error };

  const leadRaw = str(fd.get("leadId"));
  let leadId: string | null = null;
  let companyId = parsed.companyId;
  if (leadRaw) {
    const lead = await db.lead.findUnique({ where: { id: leadRaw }, select: { id: true, companyId: true } });
    if (!lead) return { error: "That enquiry no longer exists." };
    leadId = lead.id;
    // Keep the customer link in step with the enquiry when none was chosen.
    if (!companyId) companyId = lead.companyId;
  }

  await db.task.create({ data: { ...parsed, companyId, leadId } });
  revalidatePath("/admin/tasks");
  if (leadId) revalidatePath(`/admin/enquiries/${leadId}`);
  if (companyId) revalidatePath(`/admin/customers/${companyId}`);
  revalidatePath("/admin");

  const view = parsed.assigneeId === user.id ? "mine" : "all-open";
  redirect(`/admin/tasks?view=${view}&added=1`);
}

export async function updateTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const existing = await db.task.findUnique({ where: { id }, select: { id: true, leadId: true, companyId: true, assigneeId: true } });
  if (!existing) return { error: "That task no longer exists." };

  const parsed = await parseTask(fd, user.id, existing.assigneeId);
  if ("error" in parsed) return { error: parsed.error };

  await db.task.update({ where: { id }, data: parsed });
  revalidatePath("/admin/tasks");
  if (existing.leadId) revalidatePath(`/admin/enquiries/${existing.leadId}`);
  if (existing.companyId) revalidatePath(`/admin/customers/${existing.companyId}`);
  if (parsed.companyId) revalidatePath(`/admin/customers/${parsed.companyId}`);
  revalidatePath("/admin");
  redirect("/admin/tasks?view=all-open&saved=1");
}

/** Tick / untick a task. `done` is explicit ("1" | "0") so a double-click can't flip it back. */
export async function setTaskDone(fd: FormData): Promise<void> {
  const user = await requireUser("write");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const done = str(fd.get("done")) === "1";
  const task = await db.task.findUnique({
    where: { id },
    select: { id: true, title: true, leadId: true, companyId: true, completedAt: true },
  });
  if (!task) return;

  if (done && !task.completedAt) {
    await db.task.update({ where: { id }, data: { completedAt: new Date() } });
    if (task.leadId || task.companyId) {
      await logActivity({
        kind: "system",
        body: `Task completed: ${task.title}`,
        leadId: task.leadId,
        companyId: task.companyId,
        authorId: user.id,
      });
    }
  } else if (!done && task.completedAt) {
    await db.task.update({ where: { id }, data: { completedAt: null } });
  }

  revalidatePath("/admin/tasks");
  if (task.leadId) revalidatePath(`/admin/enquiries/${task.leadId}`);
  if (task.companyId) revalidatePath(`/admin/customers/${task.companyId}`);
  revalidatePath("/admin");
}

/** Writers may delete tasks assigned to them; everyone else needs the "delete" capability. */
export async function deleteTask(fd: FormData): Promise<void> {
  const user = await requireUser("write");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const task = await db.task.findUnique({
    where: { id },
    select: { id: true, assigneeId: true, leadId: true, companyId: true },
  });
  if (!task) return;
  if (!can(user.role, "delete") && task.assigneeId !== user.id) {
    throw new Error("You can only delete tasks assigned to you.");
  }

  await db.task.delete({ where: { id } });
  revalidatePath("/admin/tasks");
  if (task.leadId) revalidatePath(`/admin/enquiries/${task.leadId}`);
  if (task.companyId) revalidatePath(`/admin/customers/${task.companyId}`);
  revalidatePath("/admin");
}
