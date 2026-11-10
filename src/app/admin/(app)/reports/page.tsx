import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requirePageAccess } from "@/lib/crm/auth";
import { aed } from "@/lib/crm/format";
import { buildReport, parseRange, RANGES } from "@/lib/crm/reports";
import { EmptyState, PageHeader, Panel, StatCard, TableWrap } from "@/components/crm/ui";
import { BarList, TrendChart } from "./charts";

export const metadata: Metadata = { title: "Reports" };

const pct = (n: number | null) => (n === null ? "–" : `${Math.round(n * 100)}%`);
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
/** Money shown inside a stat card: smaller on phones so it never overflows. */
const money = (fils: number) => <span className="text-xl sm:text-3xl">{aed(fils, { compact: true })}</span>;

const EXPORTS = [
  { kind: "enquiries", label: "Enquiries" },
  { kind: "customers", label: "Customers" },
  { kind: "contacts", label: "Contacts" },
  { kind: "quotes", label: "Quotes" },
];

export default async function ReportsPage(props: PageProps<"/admin/reports">) {
  await requirePageAccess("reports");
  const sp = await props.searchParams;
  const range = parseRange(sp.range);
  const r = await buildReport(range, new Date());
  const k = r.kpis;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`How the pipeline is performing. Showing ${r.rangeLabel.toLowerCase()}; open pipeline is always the current total.`}
      />

      {/* range + exports */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Report period" className="flex flex-wrap gap-2">
          {RANGES.map((x) => (
            <Link
              key={x.id}
              href={`/admin/reports?range=${x.id}`}
              aria-current={x.id === range ? "page" : undefined}
              className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-semibold transition ${
                x.id === range
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-text hover:border-brand hover:text-brand"
              }`}
            >
              {x.label}
            </Link>
          ))}
        </nav>
        <div role="group" aria-label="Export data as CSV" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Export CSV</span>
          {EXPORTS.map((e) => (
            // Plain <a>: this is a file download from a route handler, not a page navigation.
            <a
              key={e.kind}
              href={`/admin/export/${e.kind}`}
              download
              className="btn btn-outline !min-h-[40px] !gap-1.5 !px-3.5 text-sm"
            >
              <Download size={14} aria-hidden="true" /> {e.label}
            </a>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="New enquiries" value={k.newEnquiries.toLocaleString("en-GB")} hint={`In ${r.rangeLabel.toLowerCase()}`} />
        <StatCard
          label="Won deals"
          value={k.wonCount.toLocaleString("en-GB")}
          hint={`${plural(k.lostCount, "deal")} lost`}
        />
        <StatCard label="Won value" value={money(k.wonValueFils)} hint="From enquiry values" />
        <StatCard
          label="Win rate"
          value={pct(k.winRate)}
          hint={k.winRate === null ? "No closed deals yet" : `${k.wonCount} won of ${k.wonCount + k.lostCount} closed`}
        />
        <StatCard
          label="Avg. days to win"
          value={k.avgDaysToWon === null ? "–" : (Math.round(k.avgDaysToWon * 10) / 10).toLocaleString("en-GB")}
          hint="From enquiry to won"
        />
        <StatCard
          label="Open pipeline"
          value={money(k.openPipelineFils)}
          hint={`${plural(k.openPipelineCount, "open enquiry", "open enquiries")}`}
        />
        <StatCard
          label="Quotes sent"
          value={k.quotesSent.toLocaleString("en-GB")}
          hint={k.quoteAcceptRate === null ? "None sent yet" : `${k.quotesAccepted} accepted (${pct(k.quoteAcceptRate)})`}
        />
        <StatCard label="Accepted quotes" value={money(k.acceptedValueFils)} hint={`${plural(k.quotesAccepted, "quote")}, incl. VAT`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Pipeline by stage">
          <p className="mb-4 text-xs text-muted">Enquiries created in this period, by where they are now.</p>
          <BarList
            rows={r.funnel.map((s) => ({
              label: s.label,
              value: s.count,
              tone: s.tone,
              display: (
                <>
                  {s.count}
                  <span className="ml-2 font-medium text-muted">{aed(s.valueFils, { compact: true })}</span>
                </>
              ),
            }))}
            empty="No enquiries in this period."
          />
        </Panel>

        <Panel title="Monthly trend">
          <TrendChart points={r.trend} />
        </Panel>

        <Panel title="Enquiries by source">
          <BarList
            rows={r.sources.map((g) => ({
              label: g.label,
              value: g.count,
              tone: "pink",
              display: g.count,
              sub: g.won ? `${g.won} won · ${aed(g.valueFils, { compact: true })}` : undefined,
            }))}
          />
        </Panel>

        <Panel title="Enquiries by industry">
          <BarList
            rows={r.industries.map((g) => ({
              label: g.label,
              value: g.count,
              tone: "indigo",
              display: g.count,
              sub: g.won ? `${g.won} won · ${aed(g.valueFils, { compact: true })}` : undefined,
            }))}
          />
        </Panel>

        <Panel title="Enquiries by product line">
          <p className="mb-4 text-xs text-muted">An enquiry can cover several product lines, so these can add up to more than the total.</p>
          <BarList
            rows={r.products.map((g) => ({
              label: g.label,
              value: g.count,
              tone: "orange",
              display: g.count,
              sub: g.won ? `${g.won} won · ${aed(g.valueFils, { compact: true })}` : undefined,
            }))}
            empty="No enquiries with a product line in this period."
          />
        </Panel>

        <Panel title="Lost reasons">
          <BarList
            rows={r.lostReasons.map((l) => ({
              label: l.reason,
              value: l.count,
              tone: "red",
              display: l.count,
              sub: l.valueFils ? `${aed(l.valueFils, { compact: true })} in lost value` : undefined,
            }))}
            empty="No lost deals in this period."
          />
        </Panel>

        <Panel title="Sales leaderboard" flush className="lg:col-span-2">
          {r.leaderboard.length === 0 ? (
            <EmptyState title="No activity in this period" body="Enquiries and deals will appear here once there are some." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th className="text-right">Enquiries</th>
                  <th className="text-right">Won</th>
                  <th className="text-right">Lost</th>
                  <th className="text-right">Won value</th>
                  <th className="text-right">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {r.leaderboard.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold">{o.name}</td>
                    <td className="text-right tabular-nums">{o.enquiries}</td>
                    <td className="text-right tabular-nums">{o.won}</td>
                    <td className="text-right tabular-nums">{o.lost}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">{aed(o.wonValueFils)}</td>
                    <td className="text-right tabular-nums">{pct(o.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Enquiries counts those created in the period; won and lost count deals closed in the period.
          </p>
        </Panel>

        <Panel title="Top customers by accepted quotes" className="lg:col-span-2">
          <BarList
            rows={r.topCustomers.map((c) => ({
              label: c.name,
              value: c.valueFils,
              tone: "green",
              display: aed(c.valueFils),
              sub: `${plural(c.quotes, "accepted quote")} (incl. VAT)`,
            }))}
            empty="No accepted quotes in this period."
          />
        </Panel>
      </div>
    </>
  );
}
