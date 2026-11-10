"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/crm/forms";
import { logActivity } from "@/lib/crm/activity";
import { requireUser } from "@/lib/crm/auth";
import { parseContactForm } from "@/lib/crm/customers";
import { text } from "@/lib/crm/format";
import { getDb } from "@/lib/db";

function revalidateContacts(companyIds: (string | null | undefined)[], contactId?: string) {
  revalidatePath("/admin/contacts");
  if (contactId) revalidatePath(`/admin/contacts/${contactId}`);
  for (const c of new Set(companyIds.filter(Boolean))) revalidatePath(`/admin/customers/${c}`);
}

/** Resolve the optional company on a contact form, returning an error when the id is stale. */
async function resolveCompany(companyId: string | null) {
  if (!companyId) return { ok: true as const, company: null };
  const company = await getDb()!.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  return company ? { ok: true as const, company } : { ok: false as const, error: "That customer no longer exists." };
}

/** Create a contact. `companyId` (optional hidden/select field) attaches it to a customer. */
export async function createContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const parsed = parseContactForm(fd);
  if (!parsed.ok) return { error: parsed.error };
  const co = await resolveCompany(text(fd.get("companyId")));
  if (!co.ok) return { error: co.error };

  const wantsPrimary = fd.get("isPrimary") === "on";
  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      let isPrimary = false;
      if (co.company) {
        const existing = await tx.contact.count({ where: { companyId: co.company.id } });
        isPrimary = wantsPrimary || existing === 0; // the first contact is the primary one
        if (isPrimary) await tx.contact.updateMany({ where: { companyId: co.company.id }, data: { isPrimary: false } });
      }
      const c = await tx.contact.create({ data: { ...parsed.data, companyId: co.company?.id ?? null, isPrimary } });
      return c.id;
    });
  } catch {
    return { error: "Couldn't save the contact. Please try again." };
  }

  if (co.company) {
    await logActivity({
      kind: "system",
      body: `Contact added: ${parsed.data.name}${parsed.data.jobTitle ? ` (${parsed.data.jobTitle})` : ""}.`,
      companyId: co.company.id,
      contactId: id,
      authorId: user.id,
    });
  }
  revalidateContacts([co.company?.id], id);
  return { ok: true, message: `${parsed.data.name} added.` };
}

/** Edit a contact. When the form has no `companyId` field the company is left unchanged. */
export async function updateContact(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("write");
  const db = getDb()!;

  const existing = await db.contact.findUnique({ where: { id }, select: { companyId: true, isPrimary: true } });
  if (!existing) return { error: "This contact no longer exists." };

  const parsed = parseContactForm(fd);
  if (!parsed.ok) return { error: parsed.error };

  let companyId = existing.companyId;
  if (fd.has("companyId")) {
    const co = await resolveCompany(text(fd.get("companyId")));
    if (!co.ok) return { error: co.error };
    companyId = co.company?.id ?? null;
  }
  // only forms that expose the checkbox (marked with a hidden `primaryField`) can change it
  const wantsPrimary = fd.has("primaryField") ? fd.get("isPrimary") === "on" : existing.isPrimary && companyId === existing.companyId;
  const isPrimary = !!companyId && wantsPrimary;

  try {
    await db.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.contact.updateMany({ where: { companyId, NOT: { id } }, data: { isPrimary: false } });
      }
      await tx.contact.update({ where: { id }, data: { ...parsed.data, companyId, isPrimary } });
      if (existing.isPrimary && existing.companyId && existing.companyId !== companyId) {
        // moved away from the company it was primary for: promote the oldest remaining contact
        const next = await tx.contact.findFirst({
          where: { companyId: existing.companyId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (next) await tx.contact.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    });
  } catch {
    return { error: "Couldn't save changes. Please try again." };
  }

  revalidateContacts([existing.companyId, companyId], id);
  return { ok: true, message: "Contact saved." };
}

export async function setPrimaryContact(id: string): Promise<void> {
  await requireUser("write");
  const db = getDb()!;
  const c = await db.contact.findUnique({ where: { id }, select: { companyId: true } });
  if (!c?.companyId) return;
  await db.$transaction([
    db.contact.updateMany({ where: { companyId: c.companyId }, data: { isPrimary: false } }),
    db.contact.update({ where: { id }, data: { isPrimary: true } }),
  ]);
  revalidateContacts([c.companyId], id);
}

/** Delete a contact. `redirectTo` (bound by the caller) sends the user away after deleting from a detail page. */
export async function deleteContact(id: string, redirectTo: string | null): Promise<void> {
  const user = await requireUser("delete");
  const db = getDb()!;
  const c = await db.contact.findUnique({ where: { id }, select: { companyId: true, name: true, isPrimary: true } });
  if (!c) return;

  await db.$transaction(async (tx) => {
    await tx.contact.delete({ where: { id } });
    if (c.isPrimary && c.companyId) {
      // promote the oldest remaining contact so the company keeps a primary
      const next = await tx.contact.findFirst({ where: { companyId: c.companyId }, orderBy: { createdAt: "asc" }, select: { id: true } });
      if (next) await tx.contact.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  });
  if (c.companyId) {
    await logActivity({ kind: "system", body: `Contact removed: ${c.name}.`, companyId: c.companyId, authorId: user.id });
  }
  revalidateContacts([c.companyId]);
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/quotes");
  if (redirectTo && redirectTo.startsWith("/admin/")) redirect(redirectTo);
}
