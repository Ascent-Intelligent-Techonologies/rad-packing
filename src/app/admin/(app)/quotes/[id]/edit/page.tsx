import { notFound } from "next/navigation";
import { PageHeader } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { QUOTE_STATUSES, label } from "@/lib/crm/constants";
import { toDateInput } from "@/lib/crm/format";
import { getDb } from "@/lib/db";
import { saveQuote } from "../../actions";
import { loadBuilderData } from "../../builder-data";
import { QuoteForm } from "../../QuoteForm";

export const metadata = { title: "Edit quote" };

export default async function EditQuotePage(props: PageProps<"/admin/quotes/[id]/edit">) {
  await requirePageAccess("write");
  const { id } = await props.params;
  const db = getDb()!;
  const quote = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } });
  if (!quote) notFound();

  const data = await loadBuilderData({ companyId: quote.companyId, contactId: quote.contactId });

  return (
    <>
      <PageHeader
        title={`Edit ${quote.number}`}
        subtitle={
          quote.status === "draft"
            ? "Draft quote"
            : `This quote is ${label(QUOTE_STATUSES, quote.status).toLowerCase()}. Saving changes updates the same quote number.`
        }
        back={{ href: `/admin/quotes/${quote.id}`, label: quote.number }}
      />
      <QuoteForm
        action={saveQuote}
        quoteId={quote.id}
        leadId={quote.leadId}
        defaults={{
          title: quote.title ?? "",
          companyId: quote.companyId ?? "",
          contactId: quote.contactId ?? "",
          validUntil: toDateInput(quote.validUntil),
          vatRate: quote.vatRate,
          discountFils: quote.discountFils,
          notes: quote.notes ?? "",
          terms: quote.terms ?? "",
        }}
        items={quote.items.map((i) => ({
          description: i.description,
          unit: i.unit,
          quantity: i.quantity,
          unitPriceFils: i.unitPriceFils,
          productId: i.productId,
        }))}
        companies={data.companies}
        contacts={data.contacts}
        products={data.products}
        categories={data.categories}
        cancelHref={`/admin/quotes/${quote.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
