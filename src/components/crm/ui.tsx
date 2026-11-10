import Link from "next/link";
import { initials } from "@/lib/crm/format";
import { opt, STAGES, toneClass, type Tone } from "@/lib/crm/constants";

type Opt = { id: string; label: string; tone: Tone };

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className = "",
  flush = false,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** remove body padding (tables, lists) */
  flush?: boolean;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[15px] font-bold">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Badge({ tone = "slate", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`badge ${toneClass[tone]}`}>{children}</span>;
}

export function OptBadge({ list, id }: { list: Opt[]; id: string | null | undefined }) {
  const o = opt(list, id);
  if (!o) return id ? <Badge>{id}</Badge> : null;
  return <Badge tone={o.tone}>{o.label}</Badge>;
}

export const StageBadge = ({ stage }: { stage: string }) => <OptBadge list={STAGES} id={stage} />;

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className="panel h-full p-5 transition hover:border-brand/30 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl text-brand">∅</span>
      <p className="mt-4 font-display text-lg font-bold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Labelled form field wrapper. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-text">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function ScoreChip({ score }: { score: number }) {
  const tone = score >= 70 ? "green" : score >= 40 ? "amber" : "slate";
  return (
    <span className={`badge ${toneClass[tone]}`} title="Lead score (0-100)">
      {score}
    </span>
  );
}

/** Responsive table wrapper: scrolls sideways on phones. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="tbl">{children}</table></div>;
}
