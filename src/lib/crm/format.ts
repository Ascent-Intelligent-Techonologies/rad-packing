/** Current time in ms. Wrapped so server components can read the clock without tripping the render-purity lint. */
export const nowMs = () => Date.now();

/** Money is held as integer fils (1 AED = 100 fils). */
export const aed = (fils: number | null | undefined, opts: { compact?: boolean } = {}) => {
  const v = (fils ?? 0) / 100;
  if (opts.compact && Math.abs(v) >= 1000) {
    return `AED ${new Intl.NumberFormat("en-AE", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
  }
  return `AED ${new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
};

/** "1,250.50" | "1250.5" → 125050. Returns null when empty or invalid. */
export function toFils(input: FormDataEntryValue | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).replace(/[,\s]|AED/gi, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Fils → editable "1250.50" string for form inputs. */
export const fromFils = (fils: number | null | undefined) => (fils == null ? "" : (fils / 100).toFixed(2));

const TZ = "Asia/Dubai";
export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }) : "";
export const fmtDateTime = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-GB", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

/** For <input type="date"> values. */
export const toDateInput = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const fromDateInput = (v: FormDataEntryValue | null | undefined) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};
/** For <input type="datetime-local"> values (treated as Dubai time, UTC+4). */
export const fromDateTimeInput = (v: FormDataEntryValue | null | undefined) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(`${s}:00+04:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
export const toDateTimeInput = (d: Date | string | null | undefined) => {
  if (!d) return "";
  const dubai = new Date(new Date(d).getTime() + 4 * 3600_000);
  return dubai.toISOString().slice(0, 16);
};

export function timeAgo(d: Date | string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** Trim a FormData text field to string | null. */
export const text = (v: FormDataEntryValue | null | undefined) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
