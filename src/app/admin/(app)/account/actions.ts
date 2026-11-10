"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, requireUser, revokeSessions, verifyPassword } from "@/lib/crm/auth";
import type { ActionState } from "@/components/crm/forms";

const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("view");
  const name = String(fd.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2) return { error: "Enter your name (at least 2 characters)." };
  if (name.length > 100) return { error: "That name is too long (100 characters max)." };

  await getDb()!.user.update({ where: { id: user.id }, data: { name } });
  // The sidebar in the shared layout shows the name, so refresh the whole admin tree.
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Your name has been updated." };
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("view");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!current) return { error: "Enter your current password." };
  if (next.length < MIN_PASSWORD) return { error: `Your new password needs at least ${MIN_PASSWORD} characters.` };
  if (next.length > MAX_PASSWORD) return { error: "That password is too long." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (next === current) return { error: "Choose a password that's different from your current one." };

  // Slow down anyone guessing the current password from a hijacked session.
  const rl = rateLimit(`pw:${user.id}`, 6, 15 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const db = getDb()!;
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  await revokeSessions(user.id, true);
  revalidatePath("/admin/account");
  return { ok: true, message: "Password changed. Any other devices have been signed out." };
}

export async function signOutOtherDevices(): Promise<ActionState> {
  const user = await requireUser("view");
  await revokeSessions(user.id, true);
  revalidatePath("/admin/account");
  return { ok: true, message: "Signed out of all other devices." };
}
