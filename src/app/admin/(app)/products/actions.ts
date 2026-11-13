"use server";

import { revalidatePath } from "next/cache";
import { ALL_PRODUCT_LINES, PRODUCT_LINES, UNITS } from "@/lib/crm/constants";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { text, toFils } from "@/lib/crm/format";
import { MAX_FILS } from "@/lib/crm/quotes";
import { getDb } from "@/lib/db";
import type { ActionState } from "@/components/crm/forms";

/** Create (no `id`) or update (with `id`) a price-list entry. */
export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("catalogue");
  const db = getDb()!;

  const id = text(fd.get("id"));
  const name = text(fd.get("name"));
  if (!name) return { error: "Name is required." };
  if (name.length > 200) return { error: "Name is too long (200 characters max)." };

  const category = text(fd.get("category"));
  if (category && !ALL_PRODUCT_LINES.some((p) => p.id === category)) return { error: "Choose a valid category." };

  const unit = text(fd.get("unit")) ?? "pcs";
  if (!UNITS.includes(unit)) return { error: "Choose a valid unit." };

  const rawPrice = text(fd.get("price"));
  const unitPriceFils = rawPrice ? toFils(rawPrice) : 0;
  if (unitPriceFils === null) return { error: "Unit price must be a valid amount in AED, e.g. 1250.50." };
  if (unitPriceFils > MAX_FILS) return { error: "Unit price is too large." };

  const data = {
    name,
    sku: text(fd.get("sku"))?.slice(0, 60) ?? null,
    category,
    unit,
    unitPriceFils,
    description: text(fd.get("description"))?.slice(0, 1000) ?? null,
    active: fd.get("active") === "on",
  };

  if (id) {
    const found = await db.product.findUnique({ where: { id }, select: { id: true } });
    if (!found) return { error: "That product no longer exists." };
    await db.product.update({ where: { id }, data });
  } else {
    await db.product.create({ data });
  }
  revalidatePath("/admin/products");
  return { ok: true, message: id ? "Product saved." : `"${name}" added to the price list.` };
}

export async function toggleProduct(fd: FormData): Promise<void> {
  await requireUser("catalogue");
  const id = text(fd.get("id"));
  if (!id) return;
  const db = getDb()!;
  const p = await db.product.findUnique({ where: { id }, select: { active: true } });
  if (!p) return;
  await db.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/products");
}

export async function deleteProduct(fd: FormData): Promise<void> {
  const user = await requireUser("catalogue");
  if (!can(user.role, "delete")) throw new Error("You don't have permission to do that.");
  const id = text(fd.get("id"));
  if (!id) return;
  await getDb()!.product.deleteMany({ where: { id } });
  revalidatePath("/admin/products");
}

/** One product per product line (price 0), skipping names that already exist. No prices are invented. */
export async function seedProductLines(): Promise<ActionState> {
  await requireUser("catalogue");
  const db = getDb()!;
  const existing = await db.product.findMany({ select: { name: true } });
  const have = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  const missing = PRODUCT_LINES.filter((l) => !have.has(l.label.trim().toLowerCase()));
  if (missing.length === 0) return { ok: true, message: "All five product lines are already in the price list." };
  await db.product.createMany({
    data: missing.map((l) => ({
      name: l.label,
      category: l.id,
      unit: "pcs",
      unitPriceFils: 0,
      active: true,
    })),
  });
  revalidatePath("/admin/products");
  return { ok: true, message: `Added ${missing.length} product line${missing.length === 1 ? "" : "s"}. Set their prices below.` };
}
