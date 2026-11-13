import { ALL_PRODUCT_LINES } from "@/lib/crm/constants";
import { getDb } from "@/lib/db";
import type { FormContact, FormProduct } from "./QuoteForm";

/** Reference data the quote builder needs: customers, contacts and the active price list. */
export async function loadBuilderData(ensure: { companyId?: string | null; contactId?: string | null } = {}) {
  const db = getDb()!;
  const [companies, contacts, products] = await Promise.all([
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 3000 }),
    db.contact.findMany({
      select: { id: true, name: true, companyId: true, company: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 6000,
    }),
    db.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sku: true, category: true, unit: true, unitPriceFils: true },
    }),
  ]);

  // make sure an already-linked customer / contact is selectable even in a very large database
  if (ensure.companyId && !companies.some((c) => c.id === ensure.companyId)) {
    const c = await db.company.findUnique({ where: { id: ensure.companyId }, select: { id: true, name: true } });
    if (c) companies.push(c);
  }
  const contactList: FormContact[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    companyId: c.companyId,
    companyName: c.company?.name ?? null,
  }));
  if (ensure.contactId && !contactList.some((c) => c.id === ensure.contactId)) {
    const c = await db.contact.findUnique({
      where: { id: ensure.contactId },
      select: { id: true, name: true, companyId: true, company: { select: { name: true } } },
    });
    if (c) contactList.push({ id: c.id, name: c.name, companyId: c.companyId, companyName: c.company?.name ?? null });
  }

  return {
    companies,
    contacts: contactList,
    products: products satisfies FormProduct[],
    categories: ALL_PRODUCT_LINES,
  };
}
