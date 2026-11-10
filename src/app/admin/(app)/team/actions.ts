"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashPassword, requireUser, revokeSessions } from "@/lib/crm/auth";
import { ROLES } from "@/lib/crm/constants";
import type { ActionState } from "@/components/crm/forms";

const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const validRole = (r: string) => ROLES.some((x) => x.id === r);

/** Number of OTHER active administrators (so the last one can never be removed). */
const otherActiveAdmins = (excludeId: string) =>
  getDb()!.user.count({ where: { role: "admin", active: true, NOT: { id: excludeId } } });

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("team");
  const db = getDb()!;

  const name = str(fd.get("name"));
  const email = str(fd.get("email")).toLowerCase();
  const role = str(fd.get("role"));
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) return { error: "Enter the person's full name." };
  if (name.length > 100) return { error: "That name is too long." };
  if (!z.email().safeParse(email).success) return { error: "Enter a valid email address." };
  if (!validRole(role)) return { error: "Choose a role." };
  if (password.length < MIN_PASSWORD) return { error: `The temporary password needs at least ${MIN_PASSWORD} characters.` };
  if (password.length > MAX_PASSWORD) return { error: "That password is too long." };

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "A team member with that email already exists." };
  }

  try {
    await db.user.create({ data: { name, email, role, passwordHash: await hashPassword(password) } });
  } catch {
    // unique-constraint race: someone created the same email a moment ago
    return { error: "Could not create that account. Check the email isn't already in use." };
  }

  revalidatePath("/admin/team");
  return { ok: true, message: `Account created for ${email}. Share the temporary password with them securely; they can change it from My account.` };
}

export async function changeRole(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser("team");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const role = str(fd.get("role"));
  if (!validRole(role)) return { error: "Choose a role." };

  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, active: true } });
  if (!target) return { error: "That account no longer exists." };
  if (target.role === role) return { ok: true, message: "Role unchanged." };
  if (target.id === me.id) return { error: "You can't change your own role. Ask another administrator." };
  if (target.role === "admin" && target.active && role !== "admin" && (await otherActiveAdmins(target.id)) === 0) {
    return { error: "There must always be at least one active administrator." };
  }

  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/team");
  return { ok: true, message: `${target.name} is now ${ROLES.find((r) => r.id === role)?.label}.` };
}

export async function setActive(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser("team");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const active = str(fd.get("active")) === "1";

  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, active: true } });
  if (!target) return { error: "That account no longer exists." };
  if (!active) {
    if (target.id === me.id) return { error: "You can't deactivate your own account." };
    if (target.role === "admin" && target.active && (await otherActiveAdmins(target.id)) === 0) {
      return { error: "There must always be at least one active administrator." };
    }
  }

  await db.user.update({ where: { id }, data: { active } });
  if (!active) await revokeSessions(id);
  revalidatePath("/admin/team");
  return { ok: true, message: active ? `${target.name} can sign in again.` : `${target.name} was deactivated and signed out everywhere.` };
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser("team");
  const db = getDb()!;

  const id = str(fd.get("id"));
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `The new password needs at least ${MIN_PASSWORD} characters.` };
  if (password.length > MAX_PASSWORD) return { error: "That password is too long." };

  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!target) return { error: "That account no longer exists." };
  if (target.id === me.id) return { error: "Change your own password from My account, where you confirm the current one." };

  await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  await revokeSessions(id);
  revalidatePath("/admin/team");
  return { ok: true, message: `Password reset. ${target.name} was signed out everywhere and must use the new password.` };
}
