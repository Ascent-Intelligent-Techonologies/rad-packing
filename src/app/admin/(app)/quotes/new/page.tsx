import { PageHeader } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { dateInputPlusDays } from "@/lib/crm/quotes";
import { getSettings } from "@/lib/crm/settings";
import { getDb } from "@/lib/db";
import { saveQuote } from "../actions";
import { loadBuilderData } from "../builder-data";
import { QuoteForm } from "../QuoteForm";

export const metadata = { title: "New quote" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || "";

export default async function NewQuotePage(props: PageProps<"/admin/quotes/new">) {
  await requirePageAccess("write");
  const sp = await props.searchParams;
  const db = getDb()!;

  let leadId = first(sp.leadId);
  let companyId = first(sp.companyId);
  let contactId = first(sp.contactId);
  let title = "";
  let leadNote: string | null = null;

  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      companyId ||= lead.companyId ?? "";
      contactId ||= lead.contactId ?? "";
      title = lead.title ?? "";
      const who = [lead.name, lead.company].filter(Boolean).join(", ");
      leadNote = `Quote for the enquiry "${lead.title || who || "Untitled enquiry"}"${who && lead.title ? ` (${who})` : ""}.${
        lead.companyId || !lead.company ? "" : ` ${lead.company} isn't a customer record yet: pick or create one so the quote is linked.`
      }`;
    } else {
      leadId = "";
    }
  }

  const data = await loadBuilderData({ companyId, contactId });
  if (companyId && !data.companies.some((c) => c.id === companyId)) companyId = "";
  const picked = contactId ? data.contacts.find((c) => c.id === contactId) : undefined;
  if (contactId && !picked) contactId = "";
  if (picked?.companyId && !companyId) companyId = picked.companyId;
  if (companyId && !contactId) {
    const primary = await db.contact.findFirst({ where: { companyId, isPrimary: true }, select: { id: true } });
    if (primary) contactId = primary.id;
  }

  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="New quote"
        subtitle="Add the lines, check the totals and save. You can print or send it from the next screen."
        back={{ href: leadId ? `/admin/enquiries/${leadId}` : "/admin/quotes", label: leadId ? "Enquiry" : "Quotes" }}
      />
      <QuoteForm
        action={saveQuote}
        leadId={leadId || null}
        leadNote={leadNote}
        defaults={{
          title,
          companyId,
          contactId,
          validUntil: dateInputPlusDays(settings.quoteValidityDays),
          vatRate: settings.vatRate,
          discountFils: 0,
          notes: "",
          terms: settings.quoteTerms,
        }}
        items={[]}
        companies={data.companies}
        contacts={data.contacts}
        products={data.products}
        categories={data.categories}
        cancelHref={leadId ? `/admin/enquiries/${leadId}` : "/admin/quotes"}
        submitLabel="Save quote"
      />
    </>
  );
}
