"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/crm/forms";
import { logActivity } from "@/lib/crm/activity";
import { requireUser } from "@/lib/crm/auth";
import { COMPANY_STATUSES, label } from "@/lib/crm/constants";
import { checkOwner, duplicateMessage, findDuplicateCompany } from "@/lib/crm/customers-data";
import { contactBlockHasData, parseCompanyForm, parseContactForm, type ContactInput } from "@/lib/crm/customers";
import { text } from "@/lib/crm/format";
import { getDb } from "@/lib/db";

function revalidateCustomers(id?: string) {
  revalidatePath("/admin/customers");
  if (id) revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/contacts");
}

/** Create a customer (+ optional primary contact). `fromLead` links an enquiry to the new customer. */
export async function createCustomer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const parsed = parseCompanyForm(fd);
  if (!parsed.ok) return { error: parsed.error };
  const company = parsed.data;

  let contact: ContactInput | null = null;
  if (text(fd.get("contactName"))) {
    const c = parseContactForm(fd, "contact");
    if (!c.ok) return { error: c.error };
    contact = c.data;
  } else if (contactBlockHasData(fd, "contact")) {
    return { error: "Add a name for the primary contact, or clear the contact fields." };
  }

  const owner = await checkOwner(db, company.ownerId);
  if (!owner.ok) return { error: owner.error };

  if (await findDuplicateCompany(db, company.name)) return { error: duplicateMessage(company.name) };

  const leadId = text(fd.get("fromLead"));
  const lead = leadId
    ? await db.lead.findUnique({ where: { id: leadId }, select: { id: true, title: true, name: true, company: true } })
    : null;

  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      const co = await tx.company.create({
        data: {
          ...company,
          contacts: contact ? { create: { ...contact, isPrimary: true } } : undefined,
        },
        include: { contacts: { select: { id: true } } },
      });
      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: { companyId: co.id, ...(co.contacts[0] ? { contactId: co.contacts[0].id } : {}) },
        });
      }
      return co.id;
    });
  } catch {
    return { error: "Couldn't save the customer. Please try again." };
  }

  const leadLabel = lead ? (lead.title ?? lead.name ?? lead.company ?? "enquiry") : null;
  await logActivity({
    kind: "system",
    body: lead ? `Customer created from enquiry "${leadLabel}".` : "Customer created.",
    companyId: id,
    authorId: user.id,
  });
  if (lead) {
    await logActivity({
      kind: "system",
      body: `Linked to customer ${company.name}.`,
      leadId: lead.id,
      authorId: user.id,
    });
    revalidatePath("/admin/enquiries");
    revalidatePath(`/admin/enquiries/${lead.id}`);
  }
  revalidateCustomers(id);
  redirect(`/admin/customers/${id}`);
}

export async function updateCustomer(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const existing = await db.company.findUnique({ where: { id }, include: { owner: { select: { name: true } } } });
  if (!existing) return { error: "This customer no longer exists." };

  const parsed = parseCompanyForm(fd);
  if (!parsed.ok) return { error: parsed.error };
  const data = parsed.data;

  const owner = await checkOwner(db, data.ownerId, existing.ownerId);
  if (!owner.ok) return { error: owner.error };

  if (await findDuplicateCompany(db, data.name, id)) return { error: duplicateMessage(data.name) };

  try {
    await db.company.update({ where: { id }, data });
  } catch {
    return { error: "Couldn't save changes. Please try again." };
  }

  if (data.status !== existing.status) {
    await logActivity({
      kind: "system",
      body: `Status changed from ${label(COMPANY_STATUSES, existing.status)} to ${label(COMPANY_STATUSES, data.status)}.`,
      companyId: id,
      authorId: user.id,
    });
  }
  if (data.ownerId !== existing.ownerId) {
    const next = data.ownerId ? await db.user.findUnique({ where: { id: data.ownerId }, select: { name: true } }) : null;
    await logActivity({
      kind: "system",
      body: `Owner changed from ${existing.owner?.name ?? "Unassigned"} to ${next?.name ?? "Unassigned"}.`,
      companyId: id,
      authorId: user.id,
    });
  }

  revalidateCustomers(id);
  return { ok: true, message: "Customer saved." };
}

/** Deletes the customer. Contacts, enquiries and quotes are kept (unlinked); tasks and timeline go with it. */
export async function deleteCustomer(id: string): Promise<void> {
  await requireUser("delete");
  const db = getDb()!;
  await db.$transaction([
    db.contact.updateMany({ where: { companyId: id }, data: { isPrimary: false } }),
    db.company.deleteMany({ where: { id } }),
  ]);
  revalidateCustomers();
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/tasks");
  redirect("/admin/customers");
}

/** Delete several customers at once. Their tasks and timeline go; contacts, enquiries and quotes are kept, unlinked. */
export async function bulkDeleteCustomers(fd: FormData): Promise<void> {
  await requireUser("delete");
  const ids = [...new Set(fd.getAll("ids").map(String))].filter(Boolean).slice(0, 500);
  if (!ids.length) return;
  const db = getDb()!;
  await db.$transaction([
    db.contact.updateMany({ where: { companyId: { in: ids } }, data: { isPrimary: false } }),
    db.company.deleteMany({ where: { id: { in: ids } } }),
  ]);
  revalidateCustomers();
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
}
