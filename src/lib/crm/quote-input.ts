import "server-only";
import { z } from "zod";
import { UNITS } from "./constants";
import { toFils } from "./format";
import { MAX_FILS } from "./quotes";

export type ParsedItem = {
  description: string;
  unit: string;
  quantity: number;
  unitPriceFils: number;
  productId: string | null;
};

const rowSchema = z.object({
  description: z.string().max(600).default(""),
  unit: z.string().max(20).default("pcs"),
  quantity: z.union([z.string(), z.number()]).default("1"),
  unitPrice: z.union([z.string(), z.number()]).default("0"),
  productId: z.string().max(60).nullable().optional(),
});

/**
 * Parse the hidden JSON field posted by the quote builder. Blank rows are dropped.
 * Never trusts client totals: only description / unit / quantity / unit price are read.
 */
export function parseItems(raw: string): { items: ParsedItem[] } | { error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw || "[]");
  } catch {
    return { error: "The line items could not be read. Please reload the page and try again." };
  }
  const parsed = z.array(rowSchema).max(100, "A quote can have at most 100 lines.").safeParse(json);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid line items." };

  const items: ParsedItem[] = [];
  let n = 0;
  for (const r of parsed.data) {
    n += 1;
    const description = r.description.trim();
    const priceText = String(r.unitPrice).trim();
    const priceFils = toFils(priceText);
    const qtyText = String(r.quantity).trim();
    const quantity = qtyText === "" ? 1 : Number(qtyText.replace(/,/g, ""));

    // completely empty row → ignore
    if (!description && (priceText === "" || priceFils === 0) && (qtyText === "" || qtyText === "1")) continue;

    if (!description) return { error: `Line ${n}: add a description.` };
    if (priceText !== "" && priceFils === null) return { error: `Line ${n}: the unit price is not a valid amount.` };
    if (!Number.isFinite(quantity) || quantity <= 0) return { error: `Line ${n}: quantity must be greater than zero.` };
    if (quantity > 10_000_000) return { error: `Line ${n}: quantity is too large.` };
    const unitPriceFils = priceFils ?? 0;
    if (unitPriceFils > MAX_FILS) return { error: `Line ${n}: the unit price is too large.` };

    items.push({
      description,
      unit: UNITS.includes(r.unit) ? r.unit : "pcs",
      quantity,
      unitPriceFils,
      productId: r.productId?.trim() || null,
    });
  }
  if (items.length === 0) return { error: "Add at least one line item." };
  return { items };
}
