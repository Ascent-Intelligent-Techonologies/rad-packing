import type { Tone } from "@/lib/crm/constants";

/** Solid bar colours per tone (full class names so Tailwind can see them). */
const bar: Record<Tone, string> = {
  slate: "bg-slate-400",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
};

export type BarRow = {
  label: string;
  value: number;
  /** text shown at the right of the label, e.g. "12 · AED 4.5K" */
  display: React.ReactNode;
  /** small line under the bar */
  sub?: React.ReactNode;
  tone?: Tone;
};

/**
 * Horizontal bar list. The bars are decorative (aria-hidden): every row also states its
 * label and value as text, so nothing depends on seeing the bars.
 */
export function BarList({ rows, empty = "No data for this period." }: { rows: BarRow[]; empty?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (!rows.length || max === 0) return <p className="py-4 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const pct = r.value > 0 ? Math.max(2, (r.value / max) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 break-words font-semibold">{r.label}</span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{r.display}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className={`h-full rounded-full ${bar[r.tone ?? "blue"]}`} style={{ width: `${pct}%` }} />
            </div>
            {r.sub && <p className="mt-1 text-xs text-muted">{r.sub}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export type TrendPoint = { label: string; created: number; won: number; lost: number };

const SERIES = [
  { key: "created", name: "New enquiries", cls: "bg-blue-500", dot: "bg-blue-500" },
  { key: "won", name: "Won", cls: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "lost", name: "Lost", cls: "bg-red-400", dot: "bg-red-400" },
] as const;

/** Grouped vertical bars per month. Exact figures are in the table underneath. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const max = Math.max(0, ...points.flatMap((p) => [p.created, p.won, p.lost]));
  if (max === 0) return <p className="py-4 text-center text-sm text-muted">No enquiries in this period.</p>;
  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.dot}`} aria-hidden="true" /> {s.name}
          </span>
        ))}
      </figcaption>

      <div
        role="img"
        aria-label={`Monthly new enquiries, won and lost deals for the last ${points.length} months. The exact figures are in the table below.`}
        className="flex h-44 items-end gap-1 border-b border-line sm:gap-2"
      >
        {points.map((p) => (
          <div key={p.label} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
            {SERIES.map((s) => {
              const v = p[s.key];
              return (
                <div
                  key={s.key}
                  title={`${p.label}: ${v} ${s.name.toLowerCase()}`}
                  className={`w-full max-w-4 rounded-t-sm ${s.cls}`}
                  style={{ height: v > 0 ? `${Math.max(3, (v / max) * 100)}%` : "0" }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-2" aria-hidden="true">
        {points.map((p) => (
          <span key={p.label} className="min-w-0 flex-1 text-center text-[10px] font-semibold leading-tight text-muted sm:text-xs">
            {p.label.split(" ")[0]}
            <span className="hidden sm:block">{p.label.split(" ")[1]}</span>
          </span>
        ))}
      </div>

      <details className="mt-4">
        <summary className="inline-flex min-h-[40px] cursor-pointer items-center text-sm font-semibold text-brand hover:underline">
          Show monthly figures
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-right">New</th>
                <th className="text-right">Won</th>
                <th className="text-right">Lost</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.label}>
                  <td className="font-semibold">{p.label}</td>
                  <td className="text-right tabular-nums">{p.created}</td>
                  <td className="text-right tabular-nums">{p.won}</td>
                  <td className="text-right tabular-nums">{p.lost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
