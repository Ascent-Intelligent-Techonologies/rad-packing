import { getDb } from "@/lib/db";
import { SOURCES, STAGES, label, productLineLabel } from "./constants";

export const RANGES = [
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "365", label: "Last 12 months", days: 365 },
  { id: "all", label: "All time", days: null },
] as const;
export type RangeId = (typeof RANGES)[number]["id"];

export const parseRange = (v: string | string[] | undefined): RangeId => {
  const s = Array.isArray(v) ? v[0] : v;
  return RANGES.some((r) => r.id === s) ? (s as RangeId) : "90";
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;
const DUBAI = 4 * 3600_000;

type Group = { key: string; label: string; count: number; won: number; valueFils: number };

export type Report = {
  range: RangeId;
  rangeLabel: string;
  kpis: {
    newEnquiries: number;
    wonCount: number;
    wonValueFils: number;
    lostCount: number;
    winRate: number | null;
    avgDaysToWon: number | null;
    openPipelineFils: number;
    openPipelineCount: number;
    quotesSent: number;
    quotesAccepted: number;
    quoteAcceptRate: number | null;
    acceptedValueFils: number;
  };
  funnel: { id: string; label: string; tone: (typeof STAGES)[number]["tone"]; count: number; valueFils: number }[];
  sources: Group[];
  industries: Group[];
  products: Group[];
  trend: { label: string; created: number; won: number; lost: number }[];
  leaderboard: {
    id: string;
    name: string;
    enquiries: number;
    won: number;
    lost: number;
    wonValueFils: number;
    winRate: number | null;
  }[];
  topCustomers: { id: string; name: string; valueFils: number; quotes: number }[];
  lostReasons: { reason: string; count: number; valueFils: number }[];
};

/** Month index (year*12 + month) of an instant, in Dubai time. */
const monthIndex = (d: Date) => {
  const x = new Date(d.getTime() + DUBAI);
  return x.getUTCFullYear() * 12 + x.getUTCMonth();
};

function groupBy<T>(rows: T[], keyOf: (r: T) => string[], labelOf: (k: string) => string, won: (r: T) => boolean, value: (r: T) => number) {
  const map = new Map<string, Group>();
  for (const r of rows) {
    for (const key of keyOf(r)) {
      const g = map.get(key) ?? { key, label: labelOf(key), count: 0, won: 0, valueFils: 0 };
      g.count++;
      if (won(r)) {
        g.won++;
        g.valueFils += value(r);
      }
      map.set(key, g);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Build every figure on the reports page. `now` must be read after request-time data access. */
export async function buildReport(range: RangeId, now: Date): Promise<Report> {
  const db = getDb()!;
  const def = RANGES.find((r) => r.id === range)!;
  const since = def.days ? new Date(now.getTime() - def.days * DAY) : null;

  // Monthly trend window: 6 months for short ranges, 12 for a year / all time.
  const trendMonths = range === "365" || range === "all" ? 12 : 6;
  const nowIdx = monthIndex(now);
  const trendStartIdx = nowIdx - (trendMonths - 1);
  const trendStart = new Date(Date.UTC(Math.floor(trendStartIdx / 12), trendStartIdx % 12, 1) - DUBAI);

  const earliest = since === null ? null : since < trendStart ? since : trendStart;

  const openIds = STAGES.filter((s) => s.open).map((s) => s.id);
  const [leads, openAgg, quotes] = await Promise.all([
    db.lead.findMany({
      where: earliest
        ? {
            OR: [
              { createdAt: { gte: earliest } },
              { closedAt: { gte: earliest } },
              { stage: { in: ["won", "lost"] }, closedAt: null, updatedAt: { gte: earliest } },
            ],
          }
        : {},
      select: {
        createdAt: true,
        closedAt: true,
        updatedAt: true,
        stage: true,
        source: true,
        industry: true,
        products: true,
        valueFils: true,
        ownerId: true,
        lostReason: true,
      },
    }),
    db.lead.aggregate({ where: { stage: { in: openIds } }, _sum: { valueFils: true }, _count: { _all: true } }),
    db.quote.findMany({
      where: since ? { createdAt: { gte: since } } : {},
      select: { status: true, totalFils: true, companyId: true },
    }),
  ]);

  /** When a won/lost enquiry was closed. Falls back to last update for rows closed before closedAt existed. */
  const closedOn = (l: (typeof leads)[number]) => l.closedAt ?? l.updatedAt;
  const inRange = (d: Date) => since === null || d >= since;
  const val = (l: { valueFils: number | null }) => l.valueFils ?? 0;

  const created = leads.filter((l) => inRange(l.createdAt));
  const won = leads.filter((l) => l.stage === "won" && inRange(closedOn(l)));
  const lost = leads.filter((l) => l.stage === "lost" && inRange(closedOn(l)));

  // ── KPIs ──────────────────────────────────────────────────────────
  const wonValueFils = won.reduce((n, l) => n + val(l), 0);
  const avgDaysToWon = won.length
    ? won.reduce((n, l) => n + Math.max(0, closedOn(l).getTime() - l.createdAt.getTime()) / DAY, 0) / won.length
    : null;

  const sentQuotes = quotes.filter((q) => q.status !== "draft");
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted");

  // ── funnel (enquiries created in range, by current stage) ─────────
  const funnel = STAGES.map((s) => {
    const rows = created.filter((l) => l.stage === s.id);
    return { id: s.id, label: s.label, tone: s.tone, count: rows.length, valueFils: rows.reduce((n, l) => n + val(l), 0) };
  });

  // ── breakdowns ────────────────────────────────────────────────────
  const isWon = (l: (typeof leads)[number]) => l.stage === "won";
  const sources = groupBy(created, (l) => [l.source], (k) => label(SOURCES, k), isWon, val);
  const industries = groupBy(
    created,
    (l) => [l.industry?.trim() || "Not specified"],
    (k) => k,
    isWon,
    val,
  );
  const products = groupBy(
    created.filter((l) => l.products.length > 0),
    (l) => [...new Set(l.products)],
    productLineLabel,
    isWon,
    val,
  );

  // ── monthly trend ─────────────────────────────────────────────────
  const trend = Array.from({ length: trendMonths }, (_, i) => {
    const idx = trendStartIdx + i;
    return {
      idx,
      label: `${MONTHS[idx % 12]} ${String(Math.floor(idx / 12) % 100).padStart(2, "0")}`,
      created: 0,
      won: 0,
      lost: 0,
    };
  });
  const bucket = (d: Date) => trend[monthIndex(d) - trendStartIdx];
  for (const l of leads) {
    const c = bucket(l.createdAt);
    if (c) c.created++;
    if (l.stage === "won" || l.stage === "lost") {
      const b = bucket(closedOn(l));
      if (b) b[l.stage]++;
    }
  }

  // ── leaderboard ───────────────────────────────────────────────────
  const ownerRows = new Map<string, { enquiries: number; won: number; lost: number; wonValueFils: number }>();
  const row = (id: string | null) => {
    const k = id ?? "_none";
    let r = ownerRows.get(k);
    if (!r) ownerRows.set(k, (r = { enquiries: 0, won: 0, lost: 0, wonValueFils: 0 }));
    return r;
  };
  for (const l of created) row(l.ownerId).enquiries++;
  for (const l of won) {
    const r = row(l.ownerId);
    r.won++;
    r.wonValueFils += val(l);
  }
  for (const l of lost) row(l.ownerId).lost++;

  const ownerIds = [...ownerRows.keys()].filter((k) => k !== "_none");
  const topAgg = Object.entries(
    acceptedQuotes.reduce<Record<string, { valueFils: number; quotes: number }>>((acc, q) => {
      if (!q.companyId) return acc;
      const a = (acc[q.companyId] ??= { valueFils: 0, quotes: 0 });
      a.valueFils += q.totalFils;
      a.quotes++;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1].valueFils - a[1].valueFils)
    .slice(0, 8);
  const owners = ownerIds.length
    ? await db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } })
    : [];
  const ownerName = new Map(owners.map((u) => [u.id, u.name]));
  const leaderboard = [...ownerRows.entries()]
    .map(([id, r]) => ({
      id,
      name: id === "_none" ? "Unassigned" : (ownerName.get(id) ?? "Former team member"),
      ...r,
      winRate: r.won + r.lost > 0 ? r.won / (r.won + r.lost) : null,
    }))
    .sort((a, b) => b.wonValueFils - a.wonValueFils || b.won - a.won || b.enquiries - a.enquiries);

  // ── top customers (accepted quotes) ───────────────────────────────
  const companies = topAgg.length
    ? await db.company.findMany({ where: { id: { in: topAgg.map(([id]) => id) } }, select: { id: true, name: true } })
    : [];
  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const topCustomers = topAgg.map(([id, a]) => ({
    id,
    name: companyName.get(id) ?? "Deleted customer",
    valueFils: a.valueFils,
    quotes: a.quotes,
  }));

  // ── lost reasons ──────────────────────────────────────────────────
  const reasonMap = new Map<string, { count: number; valueFils: number }>();
  for (const l of lost) {
    const k = l.lostReason?.trim() || "No reason recorded";
    const r = reasonMap.get(k) ?? { count: 0, valueFils: 0 };
    r.count++;
    r.valueFils += val(l);
    reasonMap.set(k, r);
  }
  const lostReasons = [...reasonMap.entries()]
    .map(([reason, r]) => ({ reason, ...r }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    rangeLabel: def.label,
    kpis: {
      newEnquiries: created.length,
      wonCount: won.length,
      wonValueFils,
      lostCount: lost.length,
      winRate: won.length + lost.length > 0 ? won.length / (won.length + lost.length) : null,
      avgDaysToWon,
      openPipelineFils: openAgg._sum.valueFils ?? 0,
      openPipelineCount: openAgg._count._all,
      quotesSent: sentQuotes.length,
      quotesAccepted: acceptedQuotes.length,
      quoteAcceptRate: sentQuotes.length ? acceptedQuotes.length / sentQuotes.length : null,
      acceptedValueFils: acceptedQuotes.reduce((n, q) => n + q.totalFils, 0),
    },
    funnel,
    sources,
    industries,
    products,
    trend: trend.map(({ label, created, won, lost }) => ({ label, created, won, lost })),
    leaderboard,
    topCustomers,
    lostReasons,
  };
}
