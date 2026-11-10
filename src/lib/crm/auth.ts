import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { promisify } from "node:util";
import { getDb } from "@/lib/db";
import { can, type Capability, type Role } from "./permissions";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "rad_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: string; name: string; email: string; role: Role };

/* ── passwords ─────────────────────────────────────────────────────── */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, saltHex, keyHex] = stored.split(":");
  if (alg !== "scrypt" || !saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A valid-looking hash to compare against when the email is unknown (equalises timing). */
export const DUMMY_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;

/* ── sessions (server-side, revocable) ─────────────────────────────── */

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string) {
  const db = getDb()!;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.session.create({ data: { tokenHash: sha(token), userId, expiresAt, userAgent } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb()?.session.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** Revoke every session for a user (password change, deactivation). */
export async function revokeSessions(userId: string, exceptToken?: boolean) {
  const db = getDb();
  if (!db) return;
  const keep = exceptToken ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  await db.session.deleteMany({ where: { userId, ...(keep ? { NOT: { tokenHash: sha(keep) } } : {}) } });
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const db = getDb();
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.active) return null;
  return { id: s.user.id, name: s.user.name, email: s.user.email, role: s.user.role as Role };
});

/**
 * Use at the top of every CRM page and server action.
 * Redirects to the login page when signed out; throws when the role lacks `cap`.
 */
export async function requireUser(cap: Capability = "view"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, cap)) throw new Error("You don't have permission to do that.");
  return user;
}

/** Like requireUser but for pages: sends people without access back to the dashboard. */
export async function requirePageAccess(cap: Capability): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, cap)) redirect("/admin?denied=1");
  return user;
}
