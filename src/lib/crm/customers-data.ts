import type { PrismaClient } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export type OwnerOption = { id: string; name: string; active: boolean };

/** Active staff for owner / assignee selects. Include `alsoId` so an inactive current owner isn't silently dropped. */
export async function staffOptions(alsoId?: string | null): Promise<OwnerOption[]> {
  const db = getDb()!;
  const users = await db.user.findMany({
    where: alsoId ? { OR: [{ active: true }, { id: alsoId }] } : { active: true },
    select: { id: true, name: true, active: true },
    orderBy: { name: "asc" },
  });
  return users;
}

/** An owner id from a form is valid if it's empty, unchanged, or an active user. */
export async function checkOwner(
  db: PrismaClient,
  ownerId: string | null,
  currentOwnerId: string | null = null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ownerId || ownerId === currentOwnerId) return { ok: true };
  const u = await db.user.findFirst({ where: { id: ownerId, active: true }, select: { id: true } });
  return u ? { ok: true } : { ok: false, error: "That owner isn't an active team member." };
}

/** Case-insensitive duplicate company name check. */
export async function findDuplicateCompany(db: PrismaClient, name: string, excludeId?: string) {
  return db.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true, name: true },
  });
}

export const duplicateMessage = (name: string) =>
  `A customer called "${name}" already exists. Search the customer list instead of adding it twice.`;
