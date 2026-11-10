import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { INDUSTRIES, STAGES, label } from "./constants";
import { aed } from "./format";
import { computeTotals } from "./quotes";
import { scoreLead } from "./score";
import { getSettings, nextQuoteNumber } from "./settings";

/**
 * Fictional demo data so the dashboards and reports have something to show.
 * Every created id is recorded in Setting "demoIds", so removal deletes exactly those rows.
 * All company names carry a " (demo)" suffix and all contact details are on reserved ".example" domains.
 */

const KEY = "demoIds";

type DemoIds = {
  companies: string[];
  contacts: string[];
  leads: string[];
  activities: string[];
  tasks: string[];
  quotes: string[];
  products: string[];
  /** quote counter value before / after the demo quotes, so removal can release the numbers */
  quoteCounter: { before: number; after: number } | null;
  loadedAt: string;
};

export type DemoResult = { ok: boolean; message: string };

const emptyIds = (): DemoIds => ({
  companies: [],
  contacts: [],
  leads: [],
  activities: [],
  tasks: [],
  quotes: [],
  products: [],
  quoteCounter: null,
  loadedAt: new Date().toISOString(),
});

async function readIds(): Promise<DemoIds | null> {
  const row = await getDb()!.setting.findUnique({ where: { key: KEY } });
  if (!row) return null;
  const v = (row.value ?? {}) as Partial<DemoIds>;
  return {
    companies: v.companies ?? [],
    contacts: v.contacts ?? [],
    leads: v.leads ?? [],
    activities: v.activities ?? [],
    tasks: v.tasks ?? [],
    quotes: v.quotes ?? [],
    products: v.products ?? [],
    quoteCounter: v.quoteCounter ?? null,
    loadedAt: v.loadedAt ?? "",
  };
}

/** For the settings page. */
export async function demoStatus(): Promise<{ loaded: boolean; summary: string; loadedAt: string | null }> {
  const ids = await readIds();
  if (!ids) return { loaded: false, summary: "", loadedAt: null };
  return {
    loaded: true,
    summary: `${ids.companies.length} customers, ${ids.leads.length} enquiries, ${ids.quotes.length} quotes, ${ids.tasks.length} tasks`,
    loadedAt: ids.loadedAt || null,
  };
}

/* ── deterministic helpers ─────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const did = (kind: string, n: number) => `demo_${kind}_${String(n + 1).padStart(3, "0")}`;
const noon = (ts: number) => {
  const d = new Date(ts);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
};

/* ── source material ───────────────────────────────────────────────── */

const COMPANIES = [
  { name: "Zafira Heavy Fabrication (demo)", slug: "zafira", ind: 1, city: "Sharjah" },
  { name: "Qamar Gearworks (demo)", slug: "qamar", ind: 1, city: "Ajman" },
  { name: "Halcyon Pharma Logistics (demo)", slug: "halcyon", ind: 3, city: "Dubai" },
  { name: "Sandstone Aero Components (demo)", slug: "sandstone", ind: 0, city: "Abu Dhabi" },
  { name: "Marlin Bay Offshore Supply (demo)", slug: "marlinbay", ind: 4, city: "Ras Al Khaimah" },
  { name: "Oryx Circuit Systems (demo)", slug: "oryxcircuit", ind: 2, city: "Dubai" },
  { name: "Dunecrest Machinery Trading (demo)", slug: "dunecrest", ind: 1, city: "Sharjah" },
  { name: "Palmgate Freight & Cargo (demo)", slug: "palmgate", ind: 4, city: "Dubai" },
  { name: "Ironvale Automotive Parts (demo)", slug: "ironvale", ind: 0, city: "Sharjah" },
  { name: "Coralline Medical Devices (demo)", slug: "coralline", ind: 3, city: "Abu Dhabi" },
  { name: "Falcon Ridge Engineering (demo)", slug: "falconridge", ind: 0, city: "Al Ain" },
  { name: "Saffron Bay Electronics (demo)", slug: "saffronbay", ind: 2, city: "Fujairah" },
] as const;

/** Two people per company, in company order. */
const PEOPLE: [string, string][] = [
  ["Omar Haddad", "Procurement Manager"],
  ["Priya Nair", "Logistics Coordinator"],
  ["Yusuf Karimi", "Plant Manager"],
  ["Dana Whitfield", "Purchasing Officer"],
  ["Leila Farouk", "Supply Chain Manager"],
  ["Marcus Bell", "Warehouse Supervisor"],
  ["Tariq Mansour", "Project Engineer"],
  ["Sofia Petrova", "Procurement Lead"],
  ["Hassan Idris", "Operations Manager"],
  ["Elena Costa", "Logistics Lead"],
  ["Nadia Qureshi", "Production Manager"],
  ["Daniel Okafor", "Purchasing Manager"],
  ["Khalid Saeed", "Export Coordinator"],
  ["Anita Desai", "Commercial Manager"],
  ["Ibrahim Nasser", "Operations Manager"],
  ["Chloe Martin", "Customer Service Lead"],
  ["Fadi Barakat", "Procurement Manager"],
  ["Mei Lin Tan", "Quality Engineer"],
  ["Amira Sadek", "Logistics Lead"],
  ["Victor Alvarez", "Supply Planner"],
  ["Zayed Rahman", "Project Manager"],
  ["Hannah Schmidt", "Site Engineer"],
  ["Samir Joshi", "Purchasing Manager"],
  ["Rania Aziz", "Operations Lead"],
];

/** Demo price list. Prices are illustrative. */
const PRODUCTS: { name: string; sku: string; cat: string; unit: string; aed: number }[] = [
  { name: "VCI film roll 1.5 m × 200 m", sku: "DEMO-PRE-001", cat: "preservation", unit: "roll", aed: 480 },
  { name: "High-barrier foil bag, custom size", sku: "DEMO-PRE-002", cat: "preservation", unit: "pcs", aed: 145 },
  { name: "Desiccant bag 500 g", sku: "DEMO-PRE-003", cat: "preservation", unit: "pcs", aed: 6.5 },
  { name: "Custom 3D foam liner", sku: "DEMO-PRE-004", cat: "preservation", unit: "pcs", aed: 320 },
  { name: "Nail-less plywood box 9 mm, 1200 × 800 × 800 mm", sku: "DEMO-NLB-001", cat: "nailless-boxes", unit: "pcs", aed: 650 },
  { name: "Nail-less plywood box 12 mm, 1500 × 1000 × 1000 mm", sku: "DEMO-NLB-002", cat: "nailless-boxes", unit: "pcs", aed: 980 },
  { name: "Export crate, ISPM-15 timber", sku: "DEMO-WOD-001", cat: "wooden", unit: "pcs", aed: 1450 },
  { name: "Industrial wooden pallet 1200 × 1000 mm", sku: "DEMO-WOD-002", cat: "wooden", unit: "pcs", aed: 55 },
  { name: "Stretch film 500 mm × 300 m", sku: "DEMO-TRD-001", cat: "traditional", unit: "roll", aed: 24 },
  { name: "PET strapping 16 mm, 1000 m", sku: "DEMO-TRD-002", cat: "traditional", unit: "roll", aed: 98 },
  { name: "5-ply corrugated carton 600 × 400 × 400 mm", sku: "DEMO-TRD-003", cat: "traditional", unit: "pcs", aed: 7.5 },
  { name: "On-site packing crew (per day)", sku: "DEMO-TKY-001", cat: "turnkey", unit: "day", aed: 2400 },
  { name: "Site assessment and packing plan", sku: "DEMO-TKY-002", cat: "turnkey", unit: "job", aed: 1800 },
];
const POOL: Record<string, number[]> = {
  preservation: [0, 1, 2, 3],
  "nailless-boxes": [4, 5],
  wooden: [6, 7],
  traditional: [8, 9, 10, 7],
  turnkey: [11, 12],
};

type LeadSeed = {
  co: number;
  who: 0 | 1;
  src: string;
  stage: string;
  ago: number;
  /** days ago of the last timeline event for open enquiries (default: recent) */
  endAgo?: number;
  title: string;
  msg: string;
  prod: string[];
  val: number | null;
  lost?: string;
};

/** Spread across all 7 stages, all 10 sources, the 5 industries and the 5 product lines. */
const LEADS: LeadSeed[] = [
  // ── new
  { co: 1, who: 0, src: "quote", stage: "new", ago: 0, title: "Export crates for 3 CNC gearboxes", msg: "We are shipping three gearboxes (about 1.8 t each) to a plant in Germany next month. Need ISPM-15 export crates with corrosion protection. Please send a quotation.", prod: ["wooden", "preservation"], val: 38000 },
  { co: 0, who: 1, src: "website", stage: "new", ago: 1, title: "VCI film and desiccants for spare parts stock", msg: "Looking for VCI film and desiccant bags for a spare parts warehouse that gets very humid in summer.", prod: ["preservation"], val: null },
  { co: 5, who: 0, src: "chat", stage: "new", ago: 1, title: "Nail-less boxes for monthly electronics shipments", msg: "Chat enquiry: we ship control boards every month and want reusable collapsible boxes.", prod: ["nailless-boxes"], val: 22000 },
  { co: 7, who: 0, src: "phone", stage: "new", ago: 3, title: "Pallets and stretch film, recurring supply", msg: "Phone enquiry for pallets and stretch film for a freight consolidation yard. Weekly deliveries wanted.", prod: ["traditional", "wooden"], val: 9500 },
  { co: 9, who: 1, src: "contact", stage: "new", ago: 5, title: "Barrier pouches for diagnostics", msg: "Contact form: we need cleanroom-compatible barrier pouches for diagnostic kits shipped abroad.", prod: ["preservation"], val: null },
  { co: 5, who: 1, src: "email", stage: "new", ago: 12, title: "Foam inserts for sensor modules", msg: "Emailed enquiry about protective foam inserts for small sensor modules. No quantities yet.", prod: ["traditional"], val: 6500 },
  // ── contacted
  { co: 3, who: 0, src: "referral", stage: "contacted", ago: 4, title: "Preservation packing of turbine components", msg: "Referred by an existing customer. Turbine blades and casings that need long-term preservation before shipment.", prod: ["preservation", "wooden"], val: 85000 },
  { co: 4, who: 0, src: "whatsapp", stage: "contacted", ago: 6, title: "Heavy-duty crates for offshore pump skids", msg: "WhatsApp: four pump skids, each roughly 3 m × 1.5 m, need heavy-duty crates for sea freight.", prod: ["wooden", "preservation"], val: 64000 },
  { co: 8, who: 1, src: "website", stage: "contacted", ago: 8, title: "Corrugated cartons and foams for brake assemblies", msg: "Weekly packing of brake assemblies. Looking for a reliable carton and foam supplier.", prod: ["traditional"], val: 18000 },
  { co: 6, who: 0, src: "walk_in", stage: "contacted", ago: 11, title: "Site assessment for warehouse machinery packing", msg: "Met at the yard. They are clearing a warehouse of used machinery and want an assessment first.", prod: ["turnkey"], val: 42000 },
  { co: 11, who: 0, src: "chat", stage: "contacted", ago: 16, title: "ESD-safe packaging for control panels", msg: "Chat enquiry: ESD-safe and moisture-proof packaging for finished control panels.", prod: ["preservation", "nailless-boxes"], val: 27000 },
  // ── qualified
  { co: 4, who: 1, src: "referral", stage: "qualified", ago: 7, title: "Long-term storage protection for marine engines", msg: "Six spare marine engines going into outdoor storage for 12+ months. Need full preservation packaging.", prod: ["preservation", "wooden"], val: 96000 },
  { co: 10, who: 0, src: "quote", stage: "qualified", ago: 10, title: "Export wooden cases for machining centres", msg: "Two machining centres to be exported by sea. Dimensions and weights attached to the request.", prod: ["wooden", "preservation"], val: 72000 },
  { co: 8, who: 0, src: "phone", stage: "qualified", ago: 14, title: "Collapsible plywood boxes for returnable parts", msg: "Returnable packaging loop between two plants. They want a reusable nail-less box with a fixed footprint.", prod: ["nailless-boxes"], val: 31000 },
  { co: 9, who: 0, src: "website", stage: "qualified", ago: 19, title: "Barrier packaging for medical device exports", msg: "Moisture and light barrier packaging for medical devices exported to the GCC and Europe.", prod: ["preservation", "traditional"], val: 54000 },
  { co: 7, who: 1, src: "email", stage: "qualified", ago: 23, title: "Strapping and pallets for container loading", msg: "Container loading support: pallets, strapping and stretch film for a regular lane.", prod: ["traditional", "wooden"], val: 12000 },
  // ── quote sent
  { co: 0, who: 0, src: "quote", stage: "quote_sent", ago: 12, title: "Crating of 12-ton compressor", msg: "One 12-ton compressor to be crated for road transport to Saudi Arabia.", prod: ["wooden", "turnkey"], val: 58000 },
  { co: 1, who: 1, src: "contact", stage: "quote_sent", ago: 18, title: "VCI bags for fasteners and bearings", msg: "Bearings and fasteners for export need VCI bags and cartons.", prod: ["preservation", "traditional"], val: 14500 },
  { co: 6, who: 1, src: "referral", stage: "quote_sent", ago: 26, title: "Annual packaging contract: spare parts export", msg: "Framework agreement for packaging spare parts exported to East Africa throughout the year.", prod: ["nailless-boxes", "traditional", "wooden"], val: 160000 },
  { co: 3, who: 1, src: "website", stage: "quote_sent", ago: 46, endAgo: 35, title: "Avionics ground-support equipment crates", msg: "Ground-support equipment needs custom crates with foam and foil protection.", prod: ["wooden", "preservation"], val: 47000 },
  // ── negotiation
  { co: 10, who: 1, src: "phone", stage: "negotiation", ago: 22, title: "On-site packing crew, plant shutdown", msg: "Plant shutdown in two weeks. They need an on-site crew to pack and crate redundant equipment.", prod: ["turnkey", "wooden"], val: 118000 },
  { co: 4, who: 0, src: "whatsapp", stage: "negotiation", ago: 30, title: "Sea-freight packing for generator sets", msg: "Packing 5 generator sets for sea freight to West Africa. Wants volume pricing.", prod: ["wooden", "preservation", "turnkey"], val: 185000 },
  { co: 1, who: 0, src: "other", stage: "negotiation", ago: 41, title: "Reusable nail-less boxes for pump spares", msg: "Trade-show contact. Interested in reusable boxes for pump spares sent to service centres.", prod: ["nailless-boxes"], val: 36000 },
  // ── won
  { co: 2, who: 0, src: "chat", stage: "won", ago: 20, title: "Pallet wrapping for pharma distribution", msg: "Chat enquiry: stretch film and pallets for a distribution centre.", prod: ["traditional", "wooden"], val: 24000 },
  { co: 2, who: 1, src: "website", stage: "won", ago: 44, title: "Desiccant and foil packs for lab equipment", msg: "Foil bags and desiccants for lab equipment shipped to regional distributors.", prod: ["preservation"], val: 17500 },
  { co: 0, who: 0, src: "walk_in", stage: "won", ago: 67, title: "Packing and shipping of used CNC lathe", msg: "Visited the yard. A used CNC lathe needs to be crated and prepared for export.", prod: ["wooden", "turnkey"], val: 92000 },
  // ── lost
  { co: 11, who: 1, src: "contact", stage: "lost", ago: 45, title: "Customised 3D liner and foil bag", msg: "Custom 3D liner with foil bag for a prototype instrument.", prod: ["preservation"], val: 33000, lost: "Price too high" },
  { co: 6, who: 1, src: "email", stage: "lost", ago: 72, title: "Hydraulic press export packing", msg: "Hydraulic press export packing, quotation requested by email.", prod: ["wooden", "turnkey"], val: 55000, lost: "Went with a competitor" },
];

/** Which enquiries carry a quote, and in what state. */
const QUOTE_FOR: Record<number, "draft" | "sent" | "expired" | "accepted" | "rejected"> = {
  12: "draft",
  16: "sent",
  17: "sent",
  18: "sent",
  19: "expired",
  20: "sent",
  21: "sent",
  22: "sent",
  23: "accepted",
  24: "accepted",
  25: "accepted",
  26: "rejected",
};

type TaskSeed = {
  lead: number;
  title: (first: string) => string;
  kind: string;
  priority: "low" | "normal" | "high";
  /** "today:<hour in Dubai>" | days from now (negative = overdue) | done:<days ago completed> */
  due: string;
};

const TASKS: TaskSeed[] = [
  { lead: 0, title: (f) => `Respond to new enquiry from ${f}`, kind: "follow_up", priority: "high", due: "today:10" },
  { lead: 2, title: (f) => `Call ${f} to qualify the chat enquiry`, kind: "call", priority: "normal", due: "today:15" },
  { lead: 1, title: () => "Reply to website enquiry about VCI film", kind: "email", priority: "normal", due: "-1" },
  { lead: 5, title: (f) => `Chase ${f}: no response since first email`, kind: "call", priority: "low", due: "-6" },
  { lead: 9, title: () => "Book site visit for the warehouse assessment", kind: "site_visit", priority: "normal", due: "3" },
  { lead: 11, title: () => "Prepare quotation for marine engine storage", kind: "quote", priority: "high", due: "today:16" },
  { lead: 12, title: () => "Finalise and send the machining centre quote", kind: "quote", priority: "normal", due: "1" },
  { lead: 16, title: (f) => `Follow up with ${f} on the compressor quotation`, kind: "follow_up", priority: "high", due: "-2" },
  { lead: 19, title: () => "Ask whether the avionics crates are still needed; reissue the quote", kind: "follow_up", priority: "normal", due: "-4" },
  { lead: 21, title: (f) => `Negotiation call with ${f} on generator set pricing`, kind: "call", priority: "high", due: "1" },
  { lead: 20, title: () => "Send revised commercial terms for the plant shutdown crew", kind: "email", priority: "normal", due: "5" },
  { lead: 23, title: () => "Schedule the first pallet delivery", kind: "other", priority: "normal", due: "done:1" },
  { lead: 24, title: () => "Collect signed purchase order", kind: "follow_up", priority: "normal", due: "done:15" },
  { lead: 25, title: (f) => `Post-delivery check-in with ${f}`, kind: "call", priority: "low", due: "done:30" },
  { lead: 3, title: () => "Confirm pallet specifications by phone", kind: "call", priority: "normal", due: "done:2" },
];

const firstName = (full: string) => full.split(" ")[0]!;
const asciiLower = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/* ── load ──────────────────────────────────────────────────────────── */

export async function loadDemoData(userId: string): Promise<DemoResult> {
  const db = getDb();
  if (!db) return { ok: false, message: "The database is not configured." };
  if (await readIds()) return { ok: false, message: "Demo data already loaded. Remove it first to load it again." };

  try {
    const NOW = Date.now();
    const rng = mulberry32(20260101);
    const rand = (a: number, b: number) => a + rng() * (b - a);
    /** Same calendar day, but during working hours in Dubai (09:00-17:59), never in the future. */
    const biz = (ts: number) => {
      const d = new Date(ts);
      d.setUTCHours(5 + Math.floor(rng() * 9), Math.floor(rng() * 60), 0, 0);
      return Math.min(d.getTime(), NOW - Math.round(rand(5, 120)) * MIN);
    };

    const settings = await getSettings();
    const users = await db.user.findMany({ where: { active: true }, orderBy: { createdAt: "asc" }, select: { id: true, role: true } });
    const owners = users.filter((u) => u.role !== "viewer").map((u) => u.id);
    if (owners.length === 0) owners.push(userId);
    const ownerAt = (i: number) => owners[i % owners.length]!;

    const ids = emptyIds();

    /* products */
    const productRows: Prisma.ProductCreateManyInput[] = PRODUCTS.map((p, i) => {
      const id = did("prod", i);
      ids.products.push(id);
      return {
        id,
        name: p.name,
        sku: p.sku,
        category: p.cat,
        unit: p.unit,
        unitPriceFils: Math.round(p.aed * 100),
        description: "Demo price",
        active: true,
        createdAt: new Date(NOW - 80 * DAY),
      };
    });

    /* enquiries (first pass: timeline) */
    const wonCompanies = new Set(LEADS.filter((l) => l.stage === "won").map((l) => l.co));
    const PATH: Record<string, string[]> = {
      new: [],
      contacted: ["contacted"],
      qualified: ["contacted", "qualified"],
      quote_sent: ["contacted", "qualified", "quote_sent"],
      negotiation: ["contacted", "qualified", "quote_sent", "negotiation"],
      won: ["contacted", "qualified", "quote_sent", "won"],
    };
    type Plan = {
      i: number;
      seed: LeadSeed;
      id: string;
      createdAt: number;
      steps: { stage: string; at: number }[];
      end: number;
      closed: boolean;
    };
    const plans: Plan[] = LEADS.map((seed, i) => {
      const createdAt = biz(NOW - seed.ago * DAY);
      const closed = seed.stage === "won" || seed.stage === "lost";
      const stages = seed.stage === "lost" ? (QUOTE_FOR[i] ? ["contacted", "qualified", "quote_sent", "lost"] : ["contacted", "lost"]) : PATH[seed.stage]!;
      const span = NOW - createdAt;
      const endTarget = closed ? createdAt + Math.min(span * 0.9, 28 * DAY) : NOW - (seed.endAgo ?? rand(0.3, 3)) * DAY;
      const steps: Plan["steps"] = [];
      let prev = createdAt;
      stages.forEach((stage, k) => {
        let t = biz(createdAt + ((Math.max(endTarget, createdAt + 3 * HOUR * stages.length) - createdAt) * (k + 1)) / stages.length);
        t = Math.max(t, prev + 3 * HOUR);
        t = Math.min(t, NOW - 2 * MIN);
        if (t <= prev) t = prev + MIN;
        steps.push({ stage, at: t });
        prev = t;
      });
      return { i, seed, id: did("lead", i), createdAt, steps, end: prev, closed };
    });

    /* quotes: numbered in creation order */
    type QPlan = { lead: Plan; status: (typeof QUOTE_FOR)[number]; createdAt: number; number: string; id: string };
    const qDrafts = plans
      .filter((p) => QUOTE_FOR[p.i])
      .map((p) => {
        const status = QUOTE_FOR[p.i]!;
        const sentStep = p.steps.find((s) => s.stage === "quote_sent");
        const createdAt = status === "draft" || !sentStep ? biz(NOW - 1.5 * DAY) : sentStep.at - HOUR;
        return { lead: p, status, createdAt };
      })
      .sort((a, b) => a.createdAt - b.createdAt);
    const qPlans: QPlan[] = [];
    let firstNo = 0;
    let lastNo = 0;
    for (const q of qDrafts) {
      const number = await nextQuoteNumber(settings.quotePrefix);
      const n = Number.parseInt(number.slice(settings.quotePrefix.length), 10);
      if (!firstNo) firstNo = n;
      lastNo = n;
      qPlans.push({ ...q, number, id: did("quote", qPlans.length) });
    }
    if (firstNo) ids.quoteCounter = { before: firstNo - 1, after: lastNo };

    /* quote rows + items */
    const quoteRows: Prisma.QuoteCreateManyInput[] = [];
    const itemRows: Prisma.QuoteItemCreateManyInput[] = [];
    const quoteByLead = new Map<number, { number: string; totalFils: number }>();
    qPlans.forEach((q, qi) => {
      const { seed } = q.lead;
      const pool = [...new Set(seed.prod.flatMap((s) => POOL[s] ?? []))];
      const rot = q.lead.i % Math.max(1, pool.length);
      const pick = [...pool.slice(rot), ...pool.slice(0, rot)].slice(0, 3);
      for (const extra of [8, 9]) if (pick.length < 2 && !pick.includes(extra)) pick.push(extra);
      const targetFils = Math.round(((seed.val ?? 20000) * 100) / (1 + settings.vatRate / 100));
      const shares = [0.55, 0.3, 0.15];
      const lines: { description: string; unit: string; quantity: number; unitPriceFils: number; productId: string | null }[] = pick.map((pi, k) => {
        const p = PRODUCTS[pi]!;
        const price = Math.round(p.aed * 100);
        let qty = Math.max(1, Math.round((targetFils * shares[k]!) / price));
        if (p.unit === "job") qty = 1;
        if (p.unit === "day") qty = Math.min(14, Math.max(2, qty));
        return { description: p.name, unit: p.unit, quantity: qty, unitPriceFils: price, productId: did("prod", pi) };
      });
      if (q.lead.i % 2 === 0 && lines.length < 4) {
        lines.push({ description: "Delivery and handling", unit: "job", quantity: 1, unitPriceFils: 60000 + (q.lead.i % 5) * 15000, productId: null });
      }
      const sub = computeTotals(lines, 0, settings.vatRate).subtotalFils;
      const discountFils = qi % 4 === 3 ? Math.round((sub * 0.03) / 100) * 100 : 0;
      const totals = computeTotals(lines, discountFils, settings.vatRate);
      const sentAt = q.status === "draft" ? null : new Date(q.createdAt + HOUR);
      const closedAt = q.lead.closed ? q.lead.end : null;
      const updatedAt = new Date(
        q.status === "accepted" || q.status === "rejected"
          ? (closedAt ?? q.createdAt)
          : q.status === "expired"
            ? q.createdAt + settings.quoteValidityDays * DAY
            : (sentAt?.getTime() ?? q.createdAt),
      );
      const co = COMPANIES[seed.co]!;
      quoteRows.push({
        id: q.id,
        number: q.number,
        status: q.status,
        title: seed.title,
        leadId: q.lead.id,
        companyId: did("co", seed.co),
        contactId: did("ct", seed.co * 2 + seed.who),
        validUntil: noon(q.createdAt + settings.quoteValidityDays * DAY),
        sentAt,
        currency: "AED",
        vatRate: settings.vatRate,
        subtotalFils: totals.subtotalFils,
        discountFils: totals.discountFils,
        vatFils: totals.vatFils,
        totalFils: totals.totalFils,
        notes: `Demo quotation for ${co.name}. Prices are illustrative.`,
        terms: settings.quoteTerms,
        createdById: ownerAt(q.lead.i),
        createdAt: new Date(q.createdAt),
        updatedAt,
      });
      lines.forEach((l, position) => itemRows.push({ quoteId: q.id, position, ...l }));
      quoteByLead.set(q.lead.i, { number: q.number, totalFils: totals.totalFils });
      ids.quotes.push(q.id);
    });

    /* companies + contacts */
    const companyRows: Prisma.CompanyCreateManyInput[] = COMPANIES.map((c, i) => {
      const id = did("co", i);
      ids.companies.push(id);
      return {
        id,
        name: c.name,
        industry: INDUSTRIES[c.ind],
        website: `www.${c.slug}-demo.example`,
        phone: `+971 6 000 ${String(2000 + i * 7).padStart(4, "0")}`,
        email: `info@${c.slug}-demo.example`,
        address: `Demo Industrial Area ${i + 1}`,
        city: c.city,
        country: "United Arab Emirates",
        status: wonCompanies.has(i) ? "active" : "prospect",
        tags: ["demo"],
        notes: "Fictional demo customer.",
        ownerId: ownerAt(i),
        createdAt: new Date(NOW - (85 - i) * DAY),
      };
    });
    const contactRows: Prisma.ContactCreateManyInput[] = PEOPLE.map(([name, jobTitle], i) => {
      const id = did("ct", i);
      ids.contacts.push(id);
      const co = COMPANIES[Math.floor(i / 2)]!;
      const parts = name.split(" ");
      return {
        id,
        companyId: did("co", Math.floor(i / 2)),
        name,
        jobTitle,
        email: `${asciiLower(parts[0]!)}.${asciiLower(parts[parts.length - 1]!)}@${co.slug}-demo.example`,
        phone: `+971 50 000 ${String(1000 + i * 11).padStart(4, "0")}`,
        whatsapp: i % 2 === 0 ? `+971 50 000 ${String(1000 + i * 11).padStart(4, "0")}` : null,
        isPrimary: i % 2 === 0,
        notes: "Fictional demo contact.",
        createdAt: new Date(NOW - (84 - i) * DAY),
      };
    });

    /* enquiries + timeline */
    const leadRows: Prisma.LeadCreateManyInput[] = [];
    const activityRows: Prisma.ActivityCreateManyInput[] = [];
    let actN = 0;
    const act = (a: Omit<Prisma.ActivityCreateManyInput, "id">) => {
      const id = did("act", actN++);
      ids.activities.push(id);
      activityRows.push({ id, ...a });
    };
    const viaText: Record<string, string> = {
      website: "Enquiry received via the contact form.",
      contact: "Enquiry received via the contact form.",
      quote: "Enquiry received via the quote form.",
      chat: "Enquiry received via the AI chat.",
      phone: "Enquiry taken by phone.",
      whatsapp: "Enquiry received on WhatsApp.",
      email: "Enquiry received by email.",
      referral: "Enquiry came through a referral.",
      walk_in: "Enquiry raised during a walk-in / site visit.",
      other: "Enquiry logged from a trade-show conversation.",
    };
    const viaKind = (src: string) =>
      src === "phone" ? "call" : src === "whatsapp" ? "whatsapp" : src === "email" ? "email" : src === "walk_in" ? "site_visit" : ["referral", "other"].includes(src) ? "note" : "system";

    for (const p of plans) {
      const { seed, i } = p;
      const co = COMPANIES[seed.co]!;
      const contactIdx = seed.co * 2 + seed.who;
      const [contactName, jobTitle] = PEOPLE[contactIdx]!;
      const f = firstName(contactName);
      const ownerId = ownerAt(i);
      const base = { leadId: p.id, companyId: did("co", seed.co), contactId: did("ct", contactIdx) };
      const q = quoteByLead.get(i);

      act({ ...base, kind: viaKind(seed.src), body: viaText[seed.src]!, authorId: ["website", "contact", "quote", "chat"].includes(seed.src) ? null : ownerId, createdAt: new Date(p.createdAt) });

      let from = "new";
      p.steps.forEach((s, k) => {
        const reason = seed.lost ?? "Other";
        const flavour: Record<string, { kind: string; body: string }> = {
          contacted: { kind: "call", body: `Called ${f} (${jobTitle}). Confirmed what needs packing, quantities and the shipping date.` },
          qualified: i % 2
            ? { kind: "site_visit", body: `Visited ${co.name.replace(" (demo)", "")} on site. Measured the items and agreed the packing method.` }
            : { kind: "meeting", body: `Video call with ${f} and the technical team. Requirements are clear and a quotation was requested.` },
          quote_sent: { kind: "email", body: q ? `Emailed quotation ${q.number} (${aed(q.totalFils)}) to ${f}.` : `Emailed the quotation to ${f}.` },
          negotiation: { kind: i % 2 ? "whatsapp" : "call", body: `${f} asked for better pricing on volume and a faster delivery date. Revised terms are being discussed.` },
          won: { kind: "note", body: `Purchase order received from ${co.name.replace(" (demo)", "")}. Handed over to operations.` },
          lost: { kind: "note", body: `Closed as lost. Reason: ${reason}.` },
        };
        const fl = flavour[s.stage]!;
        act({ ...base, kind: fl.kind, body: fl.body, authorId: ownerId, createdAt: new Date(Math.max(s.at - 25 * MIN, p.createdAt + MIN * (k + 1))) });
        act({
          ...base,
          kind: "stage_change",
          body: `Stage changed from ${label(STAGES, from)} to ${label(STAGES, s.stage)}${s.stage === "lost" ? `. Reason: ${reason}` : ""}.`,
          authorId: ownerId,
          createdAt: new Date(s.at),
        });
        from = s.stage;
      });

      // not every enquiry arrives with every detail, so the scores vary like real ones
      const industry = i % 4 === 2 ? null : INDUSTRIES[COMPANIES[seed.co]!.ind]!;
      const email = contactRows[contactIdx]!.email!;
      const phone = i % 3 === 1 ? null : contactRows[contactIdx]!.phone!;
      const companyText = i % 5 === 3 ? null : co.name;
      const products = seed.val === null && i % 2 === 1 ? [] : seed.prod;
      const { score } = scoreLead({
        phone,
        email,
        company: companyText,
        industry,
        products,
        message: seed.msg,
        source: seed.src,
        hasTranscript: seed.src === "chat",
      });
      const valueFils = q ? q.totalFils : seed.val != null ? seed.val * 100 : null;
      const lastTouch = p.steps.length ? p.end : null;
      leadRows.push({
        id: p.id,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.end),
        source: seed.src,
        stage: seed.stage,
        title: seed.title,
        priority: (valueFils ?? 0) >= 8_000_000 ? "high" : seed.stage === "lost" || (seed.val !== null && seed.val < 10000) ? "low" : "normal",
        score,
        name: contactName,
        company: companyText,
        email,
        phone,
        industry,
        products,
        message: seed.msg,
        transcript:
          seed.src === "chat"
            ? [
                { role: "user", content: seed.msg },
                { role: "assistant", content: "Thanks for the details. Could I take your phone number and email so the team can prepare a quotation?" },
              ]
            : undefined,
        pageUrl: ["website", "contact", "quote", "chat"].includes(seed.src) ? (seed.src === "chat" ? "/" : "/contact") : null,
        valueFils,
        expectedCloseDate: p.closed ? new Date(p.end) : noon(NOW + Math.round(rand(7, 45)) * DAY),
        lostReason: seed.stage === "lost" ? (seed.lost ?? "Other") : null,
        closedAt: p.closed ? new Date(p.end) : null,
        lastContactedAt: lastTouch ? new Date(lastTouch) : null,
        ownerId,
        companyId: did("co", seed.co),
        contactId: did("ct", contactIdx),
      });
      ids.leads.push(p.id);
    }

    /* tasks */
    const dubaiNow = new Date(NOW + 4 * HOUR);
    const dubaiMidnight = Date.UTC(dubaiNow.getUTCFullYear(), dubaiNow.getUTCMonth(), dubaiNow.getUTCDate()) - 4 * HOUR;
    const taskRows: Prisma.TaskCreateManyInput[] = TASKS.map((t, n) => {
      const p = plans[t.lead]!;
      const contactIdx = p.seed.co * 2 + p.seed.who;
      let dueAt: number;
      let completedAt: number | null = null;
      if (t.due.startsWith("today:")) dueAt = dubaiMidnight + Number(t.due.slice(6)) * HOUR;
      else if (t.due.startsWith("done:")) {
        completedAt = biz(NOW - Number(t.due.slice(5)) * DAY);
        dueAt = completedAt + 2 * HOUR;
      } else {
        const d = Number(t.due);
        dueAt = d < 0 ? biz(NOW + d * DAY) : noon(NOW + d * DAY).getTime() - 2 * HOUR;
      }
      const id = did("task", n);
      ids.tasks.push(id);
      return {
        id,
        title: t.title(firstName(PEOPLE[contactIdx]![0])),
        notes: "Demo task.",
        kind: t.kind,
        priority: t.priority,
        dueAt: new Date(dueAt),
        completedAt: completedAt ? new Date(completedAt) : null,
        assigneeId: ownerAt(t.lead),
        leadId: p.id,
        companyId: did("co", p.seed.co),
        createdAt: new Date(Math.min(NOW - MIN, Math.max(p.createdAt, Math.min(dueAt, NOW) - 3 * DAY))),
      };
    });

    /* quote events on the timeline (creation) */
    for (const q of qPlans) {
      const p = q.lead;
      const contactIdx = p.seed.co * 2 + p.seed.who;
      act({
        leadId: p.id,
        companyId: did("co", p.seed.co),
        contactId: did("ct", contactIdx),
        kind: "system",
        body: `Quote ${q.number} created: ${aed(quoteByLead.get(p.i)!.totalFils)}.`,
        authorId: ownerAt(p.i),
        createdAt: new Date(q.createdAt),
      });
    }

    /* write it all, atomically; ids are recorded in the same transaction */
    await db.$transaction(
      async (tx) => {
        await tx.product.createMany({ data: productRows });
        await tx.company.createMany({ data: companyRows });
        await tx.contact.createMany({ data: contactRows });
        await tx.lead.createMany({ data: leadRows });
        await tx.quote.createMany({ data: quoteRows });
        await tx.quoteItem.createMany({ data: itemRows });
        await tx.activity.createMany({ data: activityRows });
        await tx.task.createMany({ data: taskRows });
        await tx.setting.create({ data: { key: KEY, value: ids as unknown as Prisma.InputJsonObject } });
      },
      { timeout: 60_000, maxWait: 10_000 },
    );

    return {
      ok: true,
      message: `Demo data loaded: ${ids.companies.length} customers, ${ids.contacts.length} contacts, ${ids.leads.length} enquiries, ${ids.tasks.length} tasks, ${ids.quotes.length} quotes and ${ids.products.length} price-list products.`,
    };
  } catch (e) {
    console.error("loadDemoData failed", e);
    return { ok: false, message: "Could not load the demo data. Nothing was added; please try again." };
  }
}

/* ── remove ────────────────────────────────────────────────────────── */

export async function clearDemoData(): Promise<DemoResult> {
  const db = getDb();
  if (!db) return { ok: false, message: "The database is not configured." };
  const ids = await readIds();
  if (!ids) return { ok: false, message: "There is no demo data to remove." };

  try {
    const results = await db.$transaction([
      db.quote.deleteMany({ where: { id: { in: ids.quotes } } }), // quote items cascade
      db.task.deleteMany({ where: { id: { in: ids.tasks } } }),
      db.activity.deleteMany({ where: { id: { in: ids.activities } } }),
      db.lead.deleteMany({ where: { id: { in: ids.leads } } }), // cascades anything staff added to them
      db.contact.deleteMany({ where: { id: { in: ids.contacts } } }),
      db.company.deleteMany({ where: { id: { in: ids.companies } } }),
      db.product.deleteMany({ where: { id: { in: ids.products } } }),
      // release the quote numbers only if nobody has created a quote since
      ...(ids.quoteCounter
        ? [db.counter.updateMany({ where: { key: "quote", value: ids.quoteCounter.after }, data: { value: ids.quoteCounter.before } })]
        : []),
      db.setting.delete({ where: { key: KEY } }),
    ]);
    const [quotes, , , leads, , companies] = results as { count: number }[];
    return {
      ok: true,
      message: `Demo data removed: ${companies?.count ?? 0} customers, ${leads?.count ?? 0} enquiries and ${quotes?.count ?? 0} quotes (with their contacts, tasks, timeline entries and demo products).`,
    };
  } catch (e) {
    console.error("clearDemoData failed", e);
    return { ok: false, message: "Could not remove the demo data. Nothing was changed; please try again." };
  }
}
