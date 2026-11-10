"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { logActivity } from "@/lib/crm/activity";
import { LOST_REASONS, PRIORITIES, SOURCES, STAGES } from "@/lib/crm/constants";
import { fromDateInput, fromDateTimeInput, text, toFils } from "@/lib/crm/format";
import { changeLeadStage } from "@/lib/crm/pipeline";
import { scoreLead } from "@/lib/crm/score";
import type { ActionState } from "@/components/crm/forms";

const ids = (list: { id: string }[]) => list.map((o) => o.id);

const leadFields = z.object({
  source: z.enum(ids(SOURCES) as [string, ...string[]]),
  priority: z.enum(ids(PRIORITIES) as [string, ...string[]]),
  title: z.string().trim().max(160).optional(),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  industry: z.string().trim().max(120).optional(),
  message: z.string().trim().max(4000).optional(),
});

function parseFields(fd: FormData) {
  const raw = Object.fromEntries(
    ["source", "priority", "title", "name", "company", "email", "phone", "industry", "message"].map((k) => [k, String(fd.get(k) ?? "")]),
  );
  const parsed = leadFields.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." } as const;
  const v = parsed.data;
  if (v.email && !z.email().safeParse(v.email).success) return { error: "Please enter a valid email address." } as const;
  if (!v.name && !v.company && !v.email && !v.phone && !v.title) {
    return { error: "Add at least a name, company, contact detail or title." } as const;
  }
  return {
    data: {
      source: v.source,
      priority: v.priority,
      title: text(v.title),
      name: text(v.name),
      company: text(v.company),
      email: text(v.email)?.toLowerCase() ?? null,
      phone: text(v.phone),
      industry: text(v.industry),
      message: text(v.message),
      products: fd.getAll("products").map(String).filter(Boolean),
      valueFils: toFils(fd.get("value")),
      expectedCloseDate: fromDateInput(fd.get("expectedCloseDate")),
      ownerId: text(fd.get("ownerId")),
      companyId: text(fd.get("companyId")),
      contactId: text(fd.get("contactId")),
    },
  } as const;
}

export async function createEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const r = parseFields(fd);
  if ("error" in r) return { error: r.error };
  const db = getDb()!;
  const { score } = scoreLead({ ...r.data, hasTranscript: false });
  const lead = await db.lead.create({
    data: {
      ...r.data,
      stage: "new",
      score,
      ownerId: r.data.ownerId ?? user.id,
      activities: { create: { kind: "system", body: "Enquiry created manually.", authorId: user.id } },
    },
  });
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries/${lead.id}`);
}

export async function updateEnquiry(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const r = parseFields(fd);
  if ("error" in r) return { error: r.error };
  const db = getDb()!;
  const prev = await db.lead.findUnique({ where: { id }, select: { ownerId: true, transcript: true } });
  if (!prev) return { error: "Enquiry not found." };
  const { score } = scoreLead({ ...r.data, hasTranscript: !!prev.transcript });
  await db.lead.update({ where: { id }, data: { ...r.data, score } });
  if (prev.ownerId !== r.data.ownerId) {
    const o = r.data.ownerId ? await db.user.findUnique({ where: { id: r.data.ownerId }, select: { name: true } }) : null;
    await logActivity({ kind: "system", leadId: id, authorId: user.id, body: o ? `Assigned to ${o.name}.` : "Unassigned." });
  }
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Saved." };
}

/** Used by the board (drag & drop / select) and the detail page. */
export async function moveStage(id: string, stage: string, lostReason?: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser("write");
  if (stage === "lost" && !lostReason) return { ok: false, error: "Choose a reason for losing this enquiry." };
  try {
    const db = getDb()!;
    const lead = await db.lead.findUnique({ where: { id }, select: { ownerId: true } });
    // working an unassigned enquiry assigns it to you
    if (lead && !lead.ownerId) await db.lead.update({ where: { id }, data: { ownerId: user.id } });
    await changeLeadStage(id, stage, { userId: user.id, lostReason });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not move enquiry." };
  }
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setStageForm(id: string, fd: FormData) {
  const stage = String(fd.get("stage") ?? "");
  const reason = String(fd.get("lostReason") ?? "") || undefined;
  if (!STAGES.some((s) => s.id === stage)) return;
  await moveStage(id, stage, stage === "lost" ? reason ?? LOST_REASONS[0] : undefined);
}

export async function addActivity(leadId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const body = String(fd.get("body") ?? "").trim();
  const kind = String(fd.get("kind") ?? "note");
  if (!body) return { error: "Write something first." };
  if (body.length > 4000) return { error: "That note is too long." };
  const db = getDb()!;
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { stage: true, companyId: true, contactId: true } });
  if (!lead) return { error: "Enquiry not found." };
  await logActivity({ kind, body, leadId, companyId: lead.companyId, contactId: lead.contactId, authorId: user.id });
  // a call / email / meeting means we've reached out
  if (["call", "email", "whatsapp", "meeting", "site_visit"].includes(kind)) {
    await db.lead.update({ where: { id: leadId }, data: { lastContactedAt: new Date() } });
    if (lead.stage === "new") await changeLeadStage(leadId, "contacted", { userId: user.id });
  }
  revalidatePath(`/admin/enquiries/${leadId}`);
  return { ok: true, message: "Logged." };
}

export async function addTask(leadId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Give the task a title." };
  const db = getDb()!;
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { companyId: true } });
  if (!lead) return { error: "Enquiry not found." };
  await db.task.create({
    data: {
      title,
      kind: String(fd.get("kind") ?? "follow_up"),
      dueAt: fromDateTimeInput(fd.get("dueAt")),
      assigneeId: text(fd.get("assigneeId")) ?? user.id,
      leadId,
      companyId: lead.companyId,
    },
  });
  revalidatePath(`/admin/enquiries/${leadId}`);
  revalidatePath("/admin/tasks");
  return { ok: true, message: "Task added." };
}

export async function completeEnquiryTask(taskId: string, leadId: string, fd: FormData) {
  const user = await requireUser("write");
  const db = getDb()!;
  const done = String(fd.get("done")) === "1";
  const t = await db.task.update({ where: { id: taskId }, data: { completedAt: done ? new Date() : null } });
  if (done) await logActivity({ kind: "system", leadId, authorId: user.id, body: `Task completed: ${t.title}` });
  revalidatePath(`/admin/enquiries/${leadId}`);
  revalidatePath("/admin/tasks");
}

export async function linkCustomer(leadId: string, fd: FormData) {
  const user = await requireUser("write");
  const companyId = text(fd.get("companyId"));
  const contactId = text(fd.get("contactId"));
  const db = getDb()!;
  await db.lead.update({ where: { id: leadId }, data: { companyId, contactId } });
  if (companyId) {
    const c = await db.company.findUnique({ where: { id: companyId }, select: { name: true } });
    await logActivity({ kind: "system", leadId, companyId, authorId: user.id, body: `Linked to customer ${c?.name ?? ""}.` });
  }
  revalidatePath(`/admin/enquiries/${leadId}`);
}

export async function deleteEnquiry(id: string) {
  await requireUser("delete");
  await getDb()!.lead.delete({ where: { id } });
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries");
}
