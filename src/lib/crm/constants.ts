import { industries, products } from "@/lib/site";

export type Tone = "slate" | "blue" | "indigo" | "violet" | "amber" | "orange" | "green" | "red" | "pink";

/** Tailwind class pairs per tone: used for badges everywhere in the CRM. */
export const toneClass: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  indigo: "bg-indigo-50 text-indigo-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-800",
  orange: "bg-orange-50 text-orange-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  pink: "bg-pink-50 text-pink-700",
};

type Opt = { id: string; label: string; tone: Tone };

/** Enquiry pipeline, left to right. `won` and `lost` are closed. */
export const STAGES: (Opt & { open: boolean })[] = [
  { id: "new", label: "New", tone: "blue", open: true },
  { id: "contacted", label: "Contacted", tone: "indigo", open: true },
  { id: "qualified", label: "Qualified", tone: "violet", open: true },
  { id: "quote_sent", label: "Quote sent", tone: "amber", open: true },
  { id: "negotiation", label: "Negotiation", tone: "orange", open: true },
  { id: "won", label: "Won", tone: "green", open: false },
  { id: "lost", label: "Lost", tone: "red", open: false },
];

export const SOURCES: Opt[] = [
  { id: "website", label: "Website", tone: "blue" },
  { id: "chat", label: "Website chat", tone: "pink" },
  { id: "quote", label: "Quote form", tone: "orange" },
  { id: "contact", label: "Contact form", tone: "indigo" },
  { id: "phone", label: "Phone call", tone: "green" },
  { id: "whatsapp", label: "WhatsApp", tone: "green" },
  { id: "email", label: "Email", tone: "slate" },
  { id: "referral", label: "Referral", tone: "violet" },
  { id: "walk_in", label: "Walk-in / site visit", tone: "amber" },
  { id: "other", label: "Other", tone: "slate" },
];

export const PRIORITIES: Opt[] = [
  { id: "low", label: "Low", tone: "slate" },
  { id: "normal", label: "Normal", tone: "blue" },
  { id: "high", label: "High", tone: "red" },
];

export const COMPANY_STATUSES: Opt[] = [
  { id: "prospect", label: "Prospect", tone: "amber" },
  { id: "active", label: "Active customer", tone: "green" },
  { id: "inactive", label: "Inactive", tone: "slate" },
];

export const QUOTE_STATUSES: Opt[] = [
  { id: "draft", label: "Draft", tone: "slate" },
  { id: "sent", label: "Sent", tone: "blue" },
  { id: "accepted", label: "Accepted", tone: "green" },
  { id: "rejected", label: "Rejected", tone: "red" },
  { id: "expired", label: "Expired", tone: "amber" },
];

export const TASK_KINDS: Opt[] = [
  { id: "follow_up", label: "Follow up", tone: "blue" },
  { id: "call", label: "Call", tone: "green" },
  { id: "email", label: "Email", tone: "indigo" },
  { id: "meeting", label: "Meeting", tone: "violet" },
  { id: "site_visit", label: "Site visit", tone: "amber" },
  { id: "quote", label: "Prepare quote", tone: "orange" },
  { id: "other", label: "Other", tone: "slate" },
];

export const ACTIVITY_KINDS: Opt[] = [
  { id: "note", label: "Note", tone: "slate" },
  { id: "call", label: "Call", tone: "green" },
  { id: "email", label: "Email", tone: "indigo" },
  { id: "whatsapp", label: "WhatsApp", tone: "green" },
  { id: "meeting", label: "Meeting", tone: "violet" },
  { id: "site_visit", label: "Site visit", tone: "amber" },
  { id: "stage_change", label: "Stage change", tone: "orange" },
  { id: "system", label: "System", tone: "slate" },
];

/** Kinds a person can log by hand (system ones are written by the app). */
export const MANUAL_ACTIVITY_KINDS = ACTIVITY_KINDS.filter((k) => !["stage_change", "system"].includes(k.id));

export const LOST_REASONS = [
  "Price too high",
  "Went with a competitor",
  "Postponed / project cancelled",
  "No response",
  "Requirement not a fit",
  "Duplicate / spam",
  "Other",
];

export const ROLES: (Opt & { description: string })[] = [
  { id: "admin", label: "Administrator", tone: "red", description: "Full access, including team and settings." },
  { id: "manager", label: "Manager", tone: "violet", description: "Everything except managing the team." },
  { id: "sales", label: "Sales", tone: "blue", description: "Works enquiries, customers, quotes and tasks." },
  { id: "ops", label: "Operations", tone: "amber", description: "Works customers, quotes and tasks; no deleting." },
  { id: "viewer", label: "Viewer", tone: "slate", description: "Read-only access to everything including reports." },
];

/** The five product lines, for tagging enquiries and the price list. */
export const PRODUCT_LINES = products.map((p) => ({ id: p.slug, label: p.title }));
/**
 * Lines the website offered before it followed the company profile. Enquiries and price-list items
 * saved back then still carry these ids, so they keep a readable name and stay valid on save.
 */
export const LEGACY_PRODUCT_LINES = [
  { id: "nailless-boxes", label: "Nail-Less Collapsible Boxes (old line)" },
  { id: "wooden", label: "Wooden Packaging (old line)" },
  { id: "traditional", label: "Traditional Packaging (old line)" },
  { id: "turnkey", label: "Turnkey Contracting (old line)" },
];
export const ALL_PRODUCT_LINES = [...PRODUCT_LINES, ...LEGACY_PRODUCT_LINES];
export const productLineLabel = (id: string) => ALL_PRODUCT_LINES.find((p) => p.id === id)?.label ?? id;
/** The lines to offer in a picker: the current five, plus any old line the record already has. */
export const productLineOptions = (current: (string | null | undefined)[] = []) => [
  ...PRODUCT_LINES,
  ...LEGACY_PRODUCT_LINES.filter((l) => current.includes(l.id)),
];
export const INDUSTRIES = industries.map((i) => i.title);

export const UNITS = ["pcs", "set", "m", "m²", "m³", "kg", "roll", "box", "crate", "pallet", "job", "day", "hour"];

export function opt<T extends Opt>(list: T[], id: string | null | undefined): T | undefined {
  return list.find((o) => o.id === id);
}
export const label = (list: Opt[], id: string | null | undefined) => opt(list, id)?.label ?? id ?? "";
