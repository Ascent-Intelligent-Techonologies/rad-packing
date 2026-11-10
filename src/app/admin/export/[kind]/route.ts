import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { COMPANY_STATUSES, PRODUCT_LINES, QUOTE_STATUSES, SOURCES, STAGES, label } from "@/lib/crm/constants";
import { dubaiDate, dubaiDateTime, filsToAed, toCsv, type CsvCell } from "@/lib/crm/csv";

const KINDS = ["enquiries", "customers", "contacts", "quotes"] as const;
type Kind = (typeof KINDS)[number];

const json = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/** Safety cap so a runaway table can never exhaust memory in one request. */
const MAX_ROWS = 50_000;

export async function GET(_req: NextRequest, ctx: RouteContext<"/admin/export/[kind]">) {
  // Reading the session cookie makes this handler run at request time (never prerendered/cached).
  const user = await getCurrentUser();
  if (!user) return json(401, "Not signed in.");
  if (!can(user.role, "reports")) return json(403, "You don't have permission to export data.");

  const { kind } = await ctx.params;
  if (!(KINDS as readonly string[]).includes(kind)) return json(404, "Unknown export.");

  const db = getDb();
  if (!db) return json(503, "The database is not configured.");

  const { headers, rows } = await build(kind as Kind);
  const csv = toCsv(headers, rows);
  const filename = `rad-${kind}-${dubaiDate(new Date())}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function build(kind: Kind): Promise<{ headers: string[]; rows: CsvCell[][] }> {
  const db = getDb()!;

  if (kind === "enquiries") {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: { owner: { select: { name: true } } },
    });
    return {
      headers: [
        "Created",
        "Source",
        "Stage",
        "Title",
        "Name",
        "Company",
        "Email",
        "Phone",
        "Industry",
        "Products",
        "Value (AED)",
        "Owner",
        "Expected close",
        "Lost reason",
        "Score",
      ],
      rows: leads.map((l) => [
        dubaiDateTime(l.createdAt),
        label(SOURCES, l.source),
        label(STAGES, l.stage),
        l.title,
        l.name,
        l.company,
        l.email,
        l.phone,
        l.industry,
        l.products.map((p) => PRODUCT_LINES.find((x) => x.id === p)?.label ?? p).join("; "),
        filsToAed(l.valueFils),
        l.owner?.name,
        dubaiDate(l.expectedCloseDate),
        l.lostReason,
        l.score,
      ]),
    };
  }

  if (kind === "customers") {
    const companies = await db.company.findMany({
      orderBy: { name: "asc" },
      take: MAX_ROWS,
      include: {
        owner: { select: { name: true } },
        contacts: { where: { isPrimary: true }, take: 1, select: { name: true } },
        _count: { select: { contacts: true, leads: true, quotes: true } },
      },
    });
    return {
      headers: [
        "Created",
        "Name",
        "Status",
        "Industry",
        "City",
        "Country",
        "TRN",
        "Phone",
        "Email",
        "Website",
        "Address",
        "Tags",
        "Owner",
        "Primary contact",
        "Contacts",
        "Enquiries",
        "Quotes",
      ],
      rows: companies.map((c) => [
        dubaiDateTime(c.createdAt),
        c.name,
        label(COMPANY_STATUSES, c.status),
        c.industry,
        c.city,
        c.country,
        c.taxNumber,
        c.phone,
        c.email,
        c.website,
        c.address,
        c.tags.join("; "),
        c.owner?.name,
        c.contacts[0]?.name,
        c._count.contacts,
        c._count.leads,
        c._count.quotes,
      ]),
    };
  }

  if (kind === "contacts") {
    const contacts = await db.contact.findMany({
      orderBy: { name: "asc" },
      take: MAX_ROWS,
      include: { company: { select: { name: true } } },
    });
    return {
      headers: ["Created", "Name", "Job title", "Company", "Email", "Phone", "WhatsApp", "Primary contact"],
      rows: contacts.map((c) => [
        dubaiDateTime(c.createdAt),
        c.name,
        c.jobTitle,
        c.company?.name,
        c.email,
        c.phone,
        c.whatsapp,
        c.isPrimary,
      ]),
    };
  }

  const quotes = await db.quote.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: {
      company: { select: { name: true } },
      contact: { select: { name: true } },
      lead: { select: { title: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });
  return {
    headers: [
      "Quote number",
      "Created",
      "Status",
      "Title",
      "Customer",
      "Contact",
      "Enquiry",
      "Sent",
      "Valid until",
      "Currency",
      "Subtotal",
      "Discount",
      "VAT rate (%)",
      "VAT",
      "Total",
      "Created by",
    ],
    rows: quotes.map((q) => [
      q.number,
      dubaiDateTime(q.createdAt),
      label(QUOTE_STATUSES, q.status),
      q.title,
      q.company?.name,
      q.contact?.name,
      q.lead ? (q.lead.title ?? q.lead.name) : "",
      dubaiDate(q.sentAt),
      dubaiDate(q.validUntil),
      q.currency,
      filsToAed(q.subtotalFils),
      filsToAed(q.discountFils),
      q.vatRate,
      filsToAed(q.vatFils),
      filsToAed(q.totalFils),
      q.createdBy?.name,
    ]),
  };
}
