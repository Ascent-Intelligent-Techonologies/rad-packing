"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/components/crm/forms";
import { logActivity } from "@/lib/crm/activity";
import { requireUser } from "@/lib/crm/auth";
import { QUOTE_STATUSES, STAGES, label } from "@/lib/crm/constants";
import { aed, fromDateInput, text, toFils } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { changeLeadStage } from "@/lib/crm/pipeline";
import { parseItems } from "@/lib/crm/quote-input";
import { MAX_FILS, computeTotals, dateInputPlusDays } from "@/lib/crm/quotes";
import { getSettings, nextQuoteNumber } from "@/lib/crm/settings";
import { getDb } from "@/lib/db";

/** Timeline entry on the enquiry / customer / contact, skipped when the quote is not linked to any of them. */
async function logQuoteEvent(input: Parameters<typeof logActivity>[0]) {
  if (!input.leadId && !input.companyId && !input.contactId) return;
  await logActivity({ kind: "system", ...input });
}

function revalidateQuote(id?: string, leadId?: string | null, companyId?: string | null) {
  revalidatePath("/admin/quotes");
  if (id) revalidatePath(`/admin/quotes/${id}`);
  if (leadId) revalidatePath(`/admin/enquiries/${leadId}`);
  if (companyId) revalidatePath(`/admin/customers/${companyId}`);
}

/** Create (no `id`) or update (with `id`) a quote. All money is recomputed here from the raw inputs. */
export async function saveQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("write");
  const db = getDb()!;

  const id = text(fd.get("id"));
  const existing = id
    ? await db.quote.findUnique({ where: { id }, select: { id: true, number: true, leadId: true, totalFils: true } })
    : null;
  if (id && !existing) return { error: "That quote no longer exists." };

  const parsed = parseItems(String(fd.get("items") ?? ""));
  if ("error" in parsed) return { error: parsed.error };
  const { items } = parsed;

  const vatText = String(fd.get("vatRate") ?? "").trim();
  const vatRate = vatText === "" ? NaN : Number(vatText);
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) return { error: "VAT rate must be between 0 and 100." };

  const discountText = text(fd.get("discount"));
  const discountFils = discountText ? toFils(discountText) : 0;
  if (discountFils === null) return { error: "Discount must be a valid amount in AED." };

  const totals = computeTotals(items, discountFils, vatRate);
  if (discountFils > totals.subtotalFils) return { error: "The discount can't be more than the subtotal." };
  if (totals.totalFils > MAX_FILS || totals.subtotalFils > MAX_FILS) return { error: "The quote total is too large." };

  const title = text(fd.get("title"));
  if (title && title.length > 200) return { error: "Title is too long (200 characters max)." };
  const notes = text(fd.get("notes"));
  const terms = text(fd.get("terms"));
  if ((notes?.length ?? 0) > 5000 || (terms?.length ?? 0) > 5000) return { error: "Notes and terms are limited to 5,000 characters." };

  let companyId = text(fd.get("companyId"));
  const contactId = text(fd.get("contactId"));
  const leadId = existing ? existing.leadId : text(fd.get("leadId"));

  if (companyId && !(await db.company.findUnique({ where: { id: companyId }, select: { id: true } })))
    return { error: "The selected customer no longer exists." };
  if (leadId && !(await db.lead.findUnique({ where: { id: leadId }, select: { id: true } })))
    return { error: "The linked enquiry no longer exists." };
  if (contactId) {
    const c = await db.contact.findUnique({ where: { id: contactId }, select: { companyId: true } });
    if (!c) return { error: "The selected contact no longer exists." };
    if (c.companyId && companyId && c.companyId !== companyId) return { error: "That contact belongs to a different customer." };
    if (!companyId && c.companyId) companyId = c.companyId;
  }

  const validUntil = fromDateInput(fd.get("validUntil"));
  const lineData = items.map((it, position) => ({
    position,
    description: it.description,
    unit: it.unit,
    quantity: it.quantity,
    unitPriceFils: it.unitPriceFils,
    productId: it.productId,
  }));
  const common = {
    title,
    companyId,
    contactId,
    validUntil,
    vatRate,
    subtotalFils: totals.subtotalFils,
    discountFils: totals.discountFils,
    vatFils: totals.vatFils,
    totalFils: totals.totalFils,
    notes,
    terms,
  };

  let quoteId: string;
  if (existing) {
    await db.$transaction([
      db.quoteItem.deleteMany({ where: { quoteId: existing.id } }),
      db.quote.update({ where: { id: existing.id }, data: { ...common, items: { create: lineData } } }),
    ]);
    quoteId = existing.id;
    if (existing.totalFils !== totals.totalFils) {
      await logQuoteEvent({
        body: `Quote ${existing.number} revised: total ${aed(existing.totalFils)} → ${aed(totals.totalFils)}.`,
        leadId,
        companyId,
        contactId,
        authorId: user.id,
      });
    }
  } else {
    const settings = await getSettings();
    const number = await nextQuoteNumber(settings.quotePrefix);
    const created = await db.quote.create({
      data: { ...common, number, status: "draft", leadId, createdById: user.id, items: { create: lineData } },
      select: { id: true },
    });
    quoteId = created.id;
    await logQuoteEvent({
      body: `Quote ${number} created${title ? ` ("${title}")` : ""}: ${aed(totals.totalFils)}.`,
      leadId,
      companyId,
      contactId,
      authorId: user.id,
    });
  }

  revalidateQuote(quoteId, leadId, companyId);
  redirect(`/admin/quotes/${quoteId}`);
}

/** Make a new draft copy (new number, fresh validity date) and open it. */
export async function duplicateQuote(fd: FormData): Promise<void> {
  const user = await requireUser("write");
  const db = getDb()!;
  const id = text(fd.get("id"));
  if (!id) return;
  const src = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } });
  if (!src) return;

  const settings = await getSettings();
  const number = await nextQuoteNumber(settings.quotePrefix);
  const copy = await db.quote.create({
    data: {
      number,
      status: "draft",
      title: src.title,
      leadId: src.leadId,
      companyId: src.companyId,
      contactId: src.contactId,
      validUntil: fromDateInput(dateInputPlusDays(settings.quoteValidityDays)),
      currency: src.currency,
      vatRate: src.vatRate,
      subtotalFils: src.subtotalFils,
      discountFils: src.discountFils,
      vatFils: src.vatFils,
      totalFils: src.totalFils,
      notes: src.notes,
      terms: src.terms,
      createdById: user.id,
      items: {
        create: src.items.map((it, position) => ({
          position,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          unitPriceFils: it.unitPriceFils,
          productId: it.productId,
        })),
      },
    },
    select: { id: true },
  });
  await logQuoteEvent({
    body: `Quote ${number} created as a copy of ${src.number}.`,
    leadId: src.leadId,
    companyId: src.companyId,
    contactId: src.contactId,
    authorId: user.id,
  });
  revalidateQuote(copy.id, src.leadId, src.companyId);
  redirect(`/admin/quotes/${copy.id}`);
}

/** Move a quote between statuses. Sent / accepted also move the linked enquiry and customer. */
export async function setQuoteStatus(fd: FormData): Promise<void> {
  const user = await requireUser("write");
  const db = getDb()!;
  const id = text(fd.get("id"));
  const status = text(fd.get("status"));
  if (!id || !status || !QUOTE_STATUSES.some((s) => s.id === status)) return;

  const q = await db.quote.findUnique({ where: { id }, include: { lead: { select: { id: true, stage: true } } } });
  if (!q || q.status === status) return;

  await db.quote.update({
    where: { id },
    data: { status, ...(status === "sent" ? { sentAt: new Date() } : {}) },
  });

  await logQuoteEvent({
    body: `Quote ${q.number} marked as ${label(QUOTE_STATUSES, status).toLowerCase()} (${aed(q.totalFils)}).`,
    leadId: q.leadId,
    companyId: q.companyId,
    contactId: q.contactId,
    authorId: user.id,
  });

  if (status === "sent" && q.lead) {
    const order = (s: string) => STAGES.findIndex((x) => x.id === s);
    if (order(q.lead.stage) < order("quote_sent")) await changeLeadStage(q.lead.id, "quote_sent", { userId: user.id });
  }
  if (status === "accepted") {
    if (q.lead) await changeLeadStage(q.lead.id, "won", { userId: user.id });
    if (q.companyId) await db.company.updateMany({ where: { id: q.companyId, status: { not: "active" } }, data: { status: "active" } });
  }

  revalidateQuote(id, q.leadId, q.companyId);
}

export async function deleteQuote(fd: FormData): Promise<void> {
  const user = await requireUser("delete");
  if (!can(user.role, "delete")) return;
  const db = getDb()!;
  const id = text(fd.get("id"));
  if (!id) return;
  const q = await db.quote.findUnique({ where: { id }, select: { number: true, leadId: true, companyId: true, contactId: true } });
  if (!q) redirect("/admin/quotes");
  await db.quote.delete({ where: { id } });
  await logQuoteEvent({
    body: `Quote ${q.number} deleted.`,
    leadId: q.leadId,
    companyId: q.companyId,
    contactId: q.contactId,
    authorId: user.id,
  });
  revalidateQuote(undefined, q.leadId, q.companyId);
  redirect("/admin/quotes");
}
