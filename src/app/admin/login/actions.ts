"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSession, DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/crm/auth";

const same = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

export async function login(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const h = await headers();
  const ip = clientIp(new Request("http://x", { headers: h }));
  const rl = rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const db = getDb();
  if (!db) return { error: "The database is not configured." };

  let user = await db.user.findUnique({ where: { email } });

  // First run: the owner signs in with ADMIN_EMAIL / ADMIN_PASSWORD and the admin account is created.
  if (!user && (await db.user.count()) === 0) {
    const be = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const bp = process.env.ADMIN_PASSWORD;
    if (be && bp && email === be && same(password, bp)) {
      user = await db.user.create({
        data: { name: "Administrator", email, passwordHash: await hashPassword(bp), role: "admin" },
      });
    }
  }

  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return { error: "Incorrect email or password." };

  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  redirect("/admin");
}
