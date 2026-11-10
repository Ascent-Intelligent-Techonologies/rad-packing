import { getDb } from "@/lib/db";

/** Append a timeline entry. Safe to call from any server action. */
export async function logActivity(input: {
  kind?: string;
  body: string;
  leadId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  authorId?: string | null;
}) {
  const db = getDb();
  if (!db) return;
  await db.activity.create({
    data: {
      kind: input.kind ?? "note",
      body: input.body,
      leadId: input.leadId ?? null,
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      authorId: input.authorId ?? null,
    },
  });
}
