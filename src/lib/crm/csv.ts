/**
 * Minimal, safe CSV writer used by the /admin/export routes.
 *  - RFC 4180 quoting (quotes, commas, CR/LF)
 *  - CSV / formula injection protection: text cells that start with = + - @ (or a tab / CR)
 *    are prefixed with a single quote so spreadsheets never evaluate them
 *  - UTF-8 BOM so Excel opens Arabic / accented text correctly
 */
export type CsvCell = string | number | boolean | Date | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) s = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  else if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  else if (typeof value === "boolean") s = value ? "Yes" : "No";
  else s = value;
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** "2026-11-10 14:30" in Dubai time (UTC+4), or "" when empty. */
export function dubaiDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
}

/** "2026-11-10" in Dubai time. */
export function dubaiDate(d: Date | null | undefined): string {
  return dubaiDateTime(d).slice(0, 10);
}

/** Integer fils → "1250.50" (plain number string so spreadsheets treat it as a number). */
export function filsToAed(fils: number | null | undefined): string {
  return fils == null ? "" : (fils / 100).toFixed(2);
}
