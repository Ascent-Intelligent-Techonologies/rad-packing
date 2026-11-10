/**
 * Pure quote maths + formatting helpers. No server-only imports, so the quote builder (client)
 * and the server actions share exactly the same rules. The server always recomputes.
 */

/** Largest amount (in fils) we store: Prisma `Int` is 32-bit, so stay below it. */
export const MAX_FILS = 2_000_000_000;

/** lineTotal = round(quantity * unitPriceFils) */
export const lineTotalFils = (quantity: number, unitPriceFils: number) => Math.round(quantity * unitPriceFils);

/**
 * subtotal = sum(lineTotal); vat = round((subtotal - discount) * vatRate / 100);
 * total = subtotal - discount + vat.
 */
export function computeTotals(
  items: { quantity: number; unitPriceFils: number }[],
  discountFils: number,
  vatRate: number,
) {
  const subtotalFils = items.reduce((sum, i) => sum + lineTotalFils(i.quantity, i.unitPriceFils), 0);
  const vatFils = Math.round(((subtotalFils - discountFils) * vatRate) / 100);
  return { subtotalFils, discountFils, vatFils, totalFils: subtotalFils - discountFils + vatFils };
}

const moneyFmt = new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** 125050 → "1,250.50" (no currency prefix; used in document tables whose header says AED). */
export const money = (fils: number | null | undefined) => moneyFmt.format((fils ?? 0) / 100);

/** 2 → "2", 2.5 → "2.5", 1.3333 → "1.333". */
export const fmtQty = (n: number) => new Intl.NumberFormat("en-AE", { maximumFractionDigits: 3 }).format(n);

/** yyyy-mm-dd for "today (Dubai) + N days", for <input type="date"> defaults. */
export const dateInputPlusDays = (days: number) =>
  new Date(Date.now() + 4 * 3_600_000 + days * 86_400_000).toISOString().slice(0, 10);

/** Start of the current month in Dubai (UTC+4, no DST), as a UTC instant. */
export function dubaiMonthStart() {
  const d = new Date(Date.now() + 4 * 3_600_000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - 4 * 3_600_000);
}
