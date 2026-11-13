"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/crm/forms";
import { requireUser } from "@/lib/crm/auth";
import type { CompanySettings } from "@/lib/crm/settings";
import { getDb } from "@/lib/db";

const schema = z.object({
  legalName: z.string().trim().min(1, "Legal name is required.").max(160),
  address: z.string().trim().max(500),
  phone: z.string().trim().max(120),
  email: z.union([z.literal(""), z.email("Enter a valid company email address.")]),
  website: z.string().trim().max(200),
  trn: z.string().trim().max(40),
  vatRate: z.number("VAT rate must be a number.").min(0, "VAT rate must be between 0 and 100.").max(100, "VAT rate must be between 0 and 100."),
  quotePrefix: z.string().trim().min(1, "Quote prefix is required.").max(12, "Quote prefix can be at most 12 characters."),
  quoteValidityDays: z
    .number("Quote validity must be a number of days.")
    .int("Quote validity must be a whole number of days.")
    .min(1, "Quote validity must be between 1 and 365 days.")
    .max(365, "Quote validity must be between 1 and 365 days."),
  quoteTerms: z.string().trim().max(5000),
});

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const num = (fd: FormData, k: string) => {
  const s = str(fd, k).trim();
  return s === "" ? Number.NaN : Number(s);
};

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("settings");
  const parsed = schema.safeParse({
    legalName: str(fd, "legalName"),
    address: str(fd, "address"),
    phone: str(fd, "phone"),
    email: str(fd, "email").trim(),
    website: str(fd, "website"),
    trn: str(fd, "trn"),
    vatRate: num(fd, "vatRate"),
    quotePrefix: str(fd, "quotePrefix"),
    quoteValidityDays: num(fd, "quoteValidityDays"),
    quoteTerms: str(fd, "quoteTerms"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const value: CompanySettings = parsed.data;
  await getDb()!.setting.upsert({
    where: { key: "company" },
    create: { key: "company", value },
    update: { value },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/quotes", "layout");
  return { ok: true, message: "Settings saved." };
}
