import { COMPANY_STATUSES } from "./constants";
import { text } from "./format";

/* ── link helpers (safe on server and client) ─────────────────────── */

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** wa.me link. Local UAE numbers (05x…) get the 971 country code; "+" and "00" prefixes are respected. */
export function waHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let digits = s.replace(/\D/g, "");
  if (!s.startsWith("+")) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = `971${digits.slice(1)}`;
  }
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

/** Make sure a stored website has a scheme so it can be used as an href. */
export const webHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** True when a due date has passed (kept out of component bodies so render stays pure). */
export const isPast = (d: Date | null | undefined) => !!d && d.getTime() < Date.now();

export const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "");

/** "Gulf Foods" → "gulf foods"; used for the duplicate-name check display only. */
export const collapseSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

export function parseTags(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(/[,;\n]/)) {
    const t = collapseSpaces(part).toLowerCase().slice(0, 40);
    if (t) seen.add(t);
  }
  return [...seen].slice(0, 20);
}

/* ── form parsing / validation ────────────────────────────────────── */

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(fd: FormData, key: string, label: string, max: number): Parsed<string | null> {
  const v = text(fd.get(key));
  if (v && v.length > max) return { ok: false, error: `${label} is too long (max ${max} characters).` };
  return { ok: true, data: v };
}

function email(fd: FormData, key: string, label: string): Parsed<string | null> {
  const r = str(fd, key, label, 200);
  if (!r.ok || !r.data) return r;
  const v = r.data.toLowerCase();
  return EMAIL_RE.test(v) ? { ok: true, data: v } : { ok: false, error: `${label} doesn't look like a valid email address.` };
}

function phone(fd: FormData, key: string, label: string): Parsed<string | null> {
  const r = str(fd, key, label, 40);
  if (!r.ok || !r.data) return r;
  if (r.data.replace(/\D/g, "").length < 5) return { ok: false, error: `${label} doesn't look like a valid number.` };
  return r;
}

function website(fd: FormData, key: string): Parsed<string | null> {
  const r = str(fd, key, "Website", 200);
  if (!r.ok || !r.data) return r;
  try {
    const u = new URL(webHref(r.data));
    if (!u.hostname.includes(".")) throw new Error("host");
    return { ok: true, data: webHref(r.data) };
  } catch {
    return { ok: false, error: "Website doesn't look like a valid address (e.g. www.example.ae)." };
  }
}

/** Run field parsers in order and collect values; returns the first error. */
function collect<T extends Record<string, Parsed<unknown>>>(
  fields: T,
): Parsed<{ [K in keyof T]: T[K] extends Parsed<infer V> ? V : never }> {
  const out: Record<string, unknown> = {};
  for (const [k, r] of Object.entries(fields)) {
    if (!r.ok) return r;
    out[k] = r.data;
  }
  return { ok: true, data: out as never };
}

export type CompanyInput = {
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  taxNumber: string | null;
  status: string;
  ownerId: string | null;
  tags: string[];
  notes: string | null;
};

export function parseCompanyForm(fd: FormData): Parsed<CompanyInput> {
  const name = collapseSpaces(String(fd.get("name") ?? ""));
  if (!name) return { ok: false, error: "Company name is required." };
  if (name.length > 160) return { ok: false, error: "Company name is too long (max 160 characters)." };

  const status = String(fd.get("status") ?? "prospect");
  if (!COMPANY_STATUSES.some((s) => s.id === status)) return { ok: false, error: "Choose a valid status." };

  const r = collect({
    industry: str(fd, "industry", "Industry", 120),
    website: website(fd, "website"),
    phone: phone(fd, "phone", "Phone"),
    email: email(fd, "email", "Email"),
    address: str(fd, "address", "Address", 300),
    city: str(fd, "city", "City", 100),
    country: str(fd, "country", "Country", 100),
    taxNumber: str(fd, "taxNumber", "TRN / tax number", 60),
    notes: str(fd, "notes", "Notes", 5000),
    ownerId: str(fd, "ownerId", "Owner", 60),
  });
  if (!r.ok) return r;
  const d = r.data;
  return {
    ok: true,
    data: {
      name,
      status,
      industry: d.industry,
      website: d.website,
      phone: d.phone,
      email: d.email,
      address: d.address,
      city: d.city,
      country: d.country ?? "United Arab Emirates",
      taxNumber: d.taxNumber,
      notes: d.notes,
      ownerId: d.ownerId,
      tags: parseTags(String(fd.get("tags") ?? "")),
    },
  };
}

export type ContactInput = {
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
};

/** Field names are `name`, `jobTitle`, … or with a prefix: `contactName`, `contactJobTitle`, … */
export const contactKey = (prefix: string, k: string) => (prefix ? `${prefix}${k[0]!.toUpperCase()}${k.slice(1)}` : k);

/** True when any contact field (other than name) was filled in. */
export function contactBlockHasData(fd: FormData, prefix: string) {
  return ["jobTitle", "email", "phone", "whatsapp"].some((k) => text(fd.get(contactKey(prefix, k))));
}

export function parseContactForm(fd: FormData, prefix = ""): Parsed<ContactInput> {
  const k = (s: string) => contactKey(prefix, s);
  const name = collapseSpaces(String(fd.get(k("name")) ?? ""));
  if (!name) return { ok: false, error: "Contact name is required." };
  if (name.length > 120) return { ok: false, error: "Contact name is too long (max 120 characters)." };
  const r = collect({
    jobTitle: str(fd, k("jobTitle"), "Job title", 120),
    email: email(fd, k("email"), "Contact email"),
    phone: phone(fd, k("phone"), "Contact phone"),
    whatsapp: phone(fd, k("whatsapp"), "WhatsApp number"),
    notes: str(fd, k("notes"), "Contact notes", 2000),
  });
  if (!r.ok) return r;
  return { ok: true, data: { name, ...r.data } };
}
