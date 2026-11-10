import { getDb } from "@/lib/db";
import { site } from "@/lib/site";

export type CompanySettings = {
  legalName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  trn: string;
  vatRate: number;
  quotePrefix: string;
  quoteValidityDays: number;
  quoteTerms: string;
};

export const defaultSettings: CompanySettings = {
  legalName: site.legalName,
  address: site.location,
  phone: site.phones.map((p) => p.label).join(" | "),
  email: "",
  website: "www.radpacking.com",
  trn: "",
  vatRate: 5,
  quotePrefix: "RAD-Q-",
  quoteValidityDays: 30,
  quoteTerms:
    "Prices are in UAE Dirhams and exclude VAT unless stated. Quotation valid for the period shown. Payment terms and delivery schedule to be confirmed on order.",
};

export async function getSettings(): Promise<CompanySettings> {
  const db = getDb();
  const row = await db?.setting.findUnique({ where: { key: "company" } });
  return { ...defaultSettings, ...((row?.value as Partial<CompanySettings> | undefined) ?? {}) };
}

export async function nextQuoteNumber(prefix: string) {
  const db = getDb()!;
  const c = await db.counter.upsert({
    where: { key: "quote" },
    create: { key: "quote", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}${String(c.value).padStart(4, "0")}`;
}
