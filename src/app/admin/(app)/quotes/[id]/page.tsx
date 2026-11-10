import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Copy, Mail, Pencil, Send, XCircle, Clock, RotateCcw, Trash2 } from "lucide-react";
import { ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { LogoMark } from "@/components/Logo";
import { OptBadge } from "@/components/crm/ui";
import { requireUser } from "@/lib/crm/auth";
import { QUOTE_STATUSES } from "@/lib/crm/constants";
import { aed, fmtDate, fmtDateTime } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { fmtQty, lineTotalFils, money } from "@/lib/crm/quotes";
import { getSettings } from "@/lib/crm/settings";
import { getDb } from "@/lib/db";
import { deleteQuote, duplicateQuote, setQuoteStatus } from "../actions";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Quote" };

function StatusButton({
  id,
  status,
  className,
  children,
}: {
  id: string;
  status: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <form action={setQuoteStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={className} pendingLabel="Updating…">
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function QuotePage(props: PageProps<"/admin/quotes/[id]">) {
  const user = await requireUser("view");
  const { id } = await props.params;
  const db = getDb()!;

  const [quote, settings] = await Promise.all([
    db.quote.findUnique({
      where: { id },
      include: {
        items: { orderBy: { position: "asc" } },
        company: true,
        contact: true,
        lead: { select: { id: true, title: true, name: true, company: true, email: true, phone: true } },
        createdBy: { select: { name: true } },
      },
    }),
    getSettings(),
  ]);
  if (!quote) notFound();

  const canWrite = can(user.role, "write");
  const canDelete = can(user.role, "delete");
  const { company, contact, lead } = quote;

  // who the quote is addressed to (falls back to the raw enquiry details)
  const toCompany = company?.name ?? lead?.company ?? null;
  const toPerson = contact?.name ?? (company ? null : lead?.name) ?? null;
  const toEmail = contact?.email ?? company?.email ?? lead?.email ?? null;
  const toPhone = contact?.phone ?? company?.phone ?? lead?.phone ?? null;
  const addressLines = company ? [company.address, [company.city, company.country].filter(Boolean).join(", ")].filter(Boolean) : [];

  const mailSubject = `Quotation ${quote.number}${quote.title ? `: ${quote.title}` : ""} from ${settings.legalName}`;
  const mailBody = [
    `Dear ${contact?.name ?? lead?.name ?? "Sir/Madam"},`,
    "",
    `Thank you for your enquiry. Please find our quotation ${quote.number}${quote.title ? ` for ${quote.title}` : ""} attached.`,
    "",
    `Total: ${aed(quote.totalFils)} (including VAT)`,
    quote.validUntil ? `Valid until: ${fmtDate(quote.validUntil)}` : "",
    "",
    "Please let us know if you have any questions.",
    "",
    "Kind regards,",
    user.name,
    settings.legalName,
    settings.phone,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  const mailto = `mailto:${toEmail ?? ""}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  const btn = "btn btn-outline !min-h-[40px] !px-4 text-sm";
  const status = quote.status;

  return (
    <>
      {/* A4 page set-up; also hides the fixed mobile top bar when printing */}
      <style>{`@media print { @page { size: A4; margin: 12mm; } .fixed { display: none !important; } }`}</style>

      <div className="no-print mb-6">
        <Link href="/admin/quotes" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          ← Quotes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{quote.number}</h1>
          <OptBadge list={QUOTE_STATUSES} id={status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {quote.title ? `${quote.title} · ` : ""}
          Created {fmtDateTime(quote.createdAt)}
          {quote.createdBy ? ` by ${quote.createdBy.name}` : ""}
          {quote.sentAt ? ` · Sent ${fmtDateTime(quote.sentAt)}` : ""}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {company && (
            <span>
              <span className="text-muted">Customer: </span>
              <Link href={`/admin/customers/${company.id}`} className="font-semibold text-brand hover:underline">
                {company.name}
              </Link>
            </span>
          )}
          {lead && (
            <span>
              <span className="text-muted">Enquiry: </span>
              <Link href={`/admin/enquiries/${lead.id}`} className="font-semibold text-brand hover:underline">
                {lead.title || lead.name || lead.company || "View enquiry"}
              </Link>
            </span>
          )}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PrintButton />
          <a href={mailto} className={btn} title={toEmail ? undefined : "No email address on file: opens a blank message"}>
            <Mail size={16} /> Email to customer
          </a>
          {canWrite && (
            <>
              <Link href={`/admin/quotes/${quote.id}/edit`} className={btn}>
                <Pencil size={16} /> Edit
              </Link>
              <form action={duplicateQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <SubmitButton className={btn} pendingLabel="Copying…">
                  <Copy size={16} /> Duplicate
                </SubmitButton>
              </form>
            </>
          )}
          {canDelete && (
            <form action={deleteQuote} className="ml-auto">
              <input type="hidden" name="id" value={quote.id} />
              <ConfirmButton message={`Delete quote ${quote.number}? This cannot be undone.`}>
                <Trash2 size={16} className="mr-1.5 inline" /> Delete
              </ConfirmButton>
            </form>
          )}
        </div>

        {canWrite && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted">Status</span>
            {status !== "sent" && (
              <StatusButton id={quote.id} status="sent" className="btn btn-brand !min-h-[40px] !px-4 text-sm">
                <Send size={16} /> Mark as sent
              </StatusButton>
            )}
            {status !== "accepted" && (
              <StatusButton id={quote.id} status="accepted" className={`${btn} !text-emerald-700 hover:!border-emerald-400`}>
                <CheckCircle2 size={16} /> Mark accepted
              </StatusButton>
            )}
            {status !== "rejected" && (
              <StatusButton id={quote.id} status="rejected" className={`${btn} !text-red-600 hover:!border-red-300`}>
                <XCircle size={16} /> Mark rejected
              </StatusButton>
            )}
            {status !== "expired" && (
              <StatusButton id={quote.id} status="expired" className={btn}>
                <Clock size={16} /> Mark expired
              </StatusButton>
            )}
            {status !== "draft" && (
              <StatusButton id={quote.id} status="draft" className={btn}>
                <RotateCcw size={16} /> Back to draft
              </StatusButton>
            )}
            <p className="basis-full text-xs text-muted">
              Marking as sent moves a linked enquiry to &ldquo;Quote sent&rdquo;; accepting it marks the enquiry won and the customer active.
              The email button opens your mail app: attach the PDF (Print / Save as PDF) yourself, then mark the quote as sent.
            </p>
          </div>
        )}
      </div>

      {/* ───────── the printable document ───────── */}
      <article className="mx-auto w-full max-w-[210mm] rounded-2xl border border-line bg-white p-5 text-[13.5px] leading-relaxed shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[11.5px] print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-brand pb-5">
          <div className="flex items-start gap-3">
            <LogoMark size={46} uid="quote" />
            <div className="min-w-0">
              <p className="font-display text-xl font-extrabold leading-tight">{settings.legalName}</p>
              {settings.address && <p className="whitespace-pre-line text-muted">{settings.address}</p>}
              <p className="text-muted">
                {[settings.phone, settings.email, settings.website].filter(Boolean).join("  ·  ")}
              </p>
              {settings.trn && <p className="font-semibold">TRN: {settings.trn}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold tracking-wide text-brand">QUOTATION</p>
            <dl className="mt-1 grid grid-cols-[auto_auto] justify-end gap-x-3 gap-y-0.5">
              <dt className="text-muted">Number</dt>
              <dd className="font-bold">{quote.number}</dd>
              <dt className="text-muted">Date</dt>
              <dd className="font-semibold">{fmtDate(quote.createdAt)}</dd>
              {quote.validUntil && (
                <>
                  <dt className="text-muted">Valid until</dt>
                  <dd className="font-semibold">{fmtDate(quote.validUntil)}</dd>
                </>
              )}
            </dl>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Quotation for</p>
            <p className="mt-1 text-base font-bold">{toCompany ?? toPerson ?? "Customer"}</p>
            {toPerson && toCompany && <p>Attn: {toPerson}{contact?.jobTitle ? `, ${contact.jobTitle}` : ""}</p>}
            {addressLines.map((l) => (
              <p key={l} className="whitespace-pre-line text-muted">
                {l}
              </p>
            ))}
            {toEmail && <p className="break-all text-muted">{toEmail}</p>}
            {toPhone && <p className="text-muted">{toPhone}</p>}
            {company?.taxNumber && <p className="text-muted">TRN: {company.taxNumber}</p>}
          </div>
          {quote.title && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Subject</p>
              <p className="mt-1 text-base font-bold">{quote.title}</p>
            </div>
          )}
        </section>

        <div className="mt-6 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[560px] border-collapse text-left print:min-w-0">
            <thead>
              <tr className="bg-brand-50 text-[11px] uppercase tracking-wider text-brand print:bg-transparent print:border-b print:border-black">
                <th className="w-8 px-2 py-2 font-bold">#</th>
                <th className="px-2 py-2 font-bold">Description</th>
                <th className="px-2 py-2 font-bold">Unit</th>
                <th className="px-2 py-2 text-right font-bold">Qty</th>
                <th className="px-2 py-2 text-right font-bold">Unit price</th>
                <th className="px-2 py-2 text-right font-bold">Amount (AED)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it, i) => (
                <tr key={it.id} className="border-b border-line break-inside-avoid align-top">
                  <td className="px-2 py-2.5 text-muted">{i + 1}</td>
                  <td className="whitespace-pre-line px-2 py-2.5 font-medium">{it.description}</td>
                  <td className="px-2 py-2.5">{it.unit}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmtQty(it.quantity)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{money(it.unitPriceFils)}</td>
                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums">
                    {money(lineTotalFils(it.quantity, it.unitPriceFils))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end break-inside-avoid">
          <dl className="w-full max-w-[320px] space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{aed(quote.subtotalFils)}</dd>
            </div>
            {quote.discountFils > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Discount</dt>
                <dd className="tabular-nums">− {aed(quote.discountFils)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">VAT ({quote.vatRate}%)</dt>
              <dd className="tabular-nums">{aed(quote.vatFils)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-brand pt-2 text-base font-extrabold print:border-black">
              <dt>TOTAL</dt>
              <dd className="tabular-nums">{aed(quote.totalFils)}</dd>
            </div>
          </dl>
        </div>

        {(quote.notes || quote.terms) && (
          <section className="mt-8 grid gap-5 break-inside-avoid">
            {quote.notes && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Notes</p>
                <p className="mt-1 whitespace-pre-line">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Terms &amp; conditions</p>
                <p className="mt-1 whitespace-pre-line text-muted">{quote.terms}</p>
              </div>
            )}
          </section>
        )}

        <footer className="mt-8 border-t border-line pt-3 text-center text-xs text-muted">
          {settings.legalName}
          {settings.website ? ` · ${settings.website}` : ""}
          {settings.email ? ` · ${settings.email}` : ""}
        </footer>
      </article>
    </>
  );
}
