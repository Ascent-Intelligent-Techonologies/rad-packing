import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState, OptBadge, PageHeader, Panel, StatCard, TableWrap } from "@/components/crm/ui";
import { requireUser } from "@/lib/crm/auth";
import { QUOTE_STATUSES } from "@/lib/crm/constants";
import { aed, fmtDate } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { dubaiMonthStart } from "@/lib/crm/quotes";
import { getDb } from "@/lib/db";

export const metadata = { title: "Quotes" };

const PAGE_SIZE = 25;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || "";

export default async function QuotesPage(props: PageProps<"/admin/quotes">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const q = first(sp.q);
  const status = QUOTE_STATUSES.some((s) => s.id === first(sp.status)) ? first(sp.status) : "";
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);

  const db = getDb()!;
  const canWrite = can(user.role, "write");

  const monthStart = dubaiMonthStart();
  const now = new Date();

  const where: Prisma.QuoteWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { company: { name: { contains: q, mode: "insensitive" } } },
            { lead: { company: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, matching, byStatus, acceptedMonth] = await Promise.all([
    db.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        company: { select: { name: true } },
        lead: { select: { company: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    db.quote.count({ where }),
    db.quote.groupBy({ by: ["status"], _count: { _all: true }, _sum: { totalFils: true } }),
    db.quote.aggregate({ where: { status: "accepted", updatedAt: { gte: monthStart } }, _sum: { totalFils: true }, _count: { _all: true } }),
  ]);

  const stat = (s: string) => byStatus.find((b) => b.status === s);
  const allCount = byStatus.reduce((n, b) => n + b._count._all, 0);
  const drafts = stat("draft")?._count._all ?? 0;
  const sent = stat("sent");
  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, status, ...over })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/quotes${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    `inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-brand bg-brand text-white" : "border-line bg-white text-text hover:border-brand/40"
    }`;
  const customerOf = (r: (typeof rows)[number]) => r.company?.name ?? r.lead?.company ?? r.lead?.name ?? "–";
  const overdue = (r: (typeof rows)[number]) =>
    !!r.validUntil && r.validUntil < now && (r.status === "draft" || r.status === "sent");

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle="Build, send and track quotations."
        actions={
          <>
            {can(user.role, "reports") && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, must bypass client routing
              <a href="/admin/export/quotes" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
                <Download size={16} /> Export CSV
              </a>
            )}
            {canWrite && (
              <Link href="/admin/quotes/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
                <Plus size={16} /> New quote
              </Link>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Drafts" value={drafts} hint="Not yet sent to a customer" href={href({ status: "draft", q: undefined, page: undefined })} />
        <StatCard
          label="Open (sent) value"
          value={aed(sent?._sum.totalFils ?? 0, { compact: true })}
          hint={`${sent?._count._all ?? 0} quote${sent?._count._all === 1 ? "" : "s"} awaiting a decision`}
          href={href({ status: "sent", q: undefined, page: undefined })}
        />
        <StatCard
          label="Accepted this month"
          value={aed(acceptedMonth._sum.totalFils ?? 0, { compact: true })}
          hint={`${acceptedMonth._count._all} quote${acceptedMonth._count._all === 1 ? "" : "s"} accepted`}
          href={href({ status: "accepted", q: undefined, page: undefined })}
        />
      </div>

      <Panel flush>
        <div className="space-y-3 border-b border-line p-4">
          <form action="/admin/quotes" className="flex flex-col gap-2 sm:flex-row">
            {status && <input type="hidden" name="status" value={status} />}
            <label className="relative block flex-1">
              <span className="sr-only">Search quotes</span>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={q} placeholder="Search number, title or customer" className="field-sm !pl-10" />
            </label>
            <button className="btn btn-brand !min-h-[42px] !px-5 text-sm">Search</button>
          </form>
          <div className="flex flex-wrap gap-2" aria-label="Filter by status">
            <Link href={href({ status: undefined, page: undefined })} className={chip(!status)}>
              All <span className="opacity-70">{allCount}</span>
            </Link>
            {QUOTE_STATUSES.map((s) => (
              <Link key={s.id} href={href({ status: s.id, page: undefined })} className={chip(status === s.id)}>
                {s.label} <span className="opacity-70">{stat(s.id)?._count._all ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={q || status ? "No quotes match" : "No quotes yet"}
            body={q || status ? "Try a different search or clear the filter." : "Create your first quotation to see it here."}
            action={
              canWrite && !q && !status ? (
                <Link href="/admin/quotes/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
                  <Plus size={16} /> New quote
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/quotes/${r.id}`} className="block px-4 py-3.5 transition hover:bg-[#f8f9ff]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-brand">{r.number}</p>
                        <p className="truncate text-sm font-semibold">{r.title || "Untitled quote"}</p>
                        <p className="truncate text-sm text-muted">{customerOf(r)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display font-extrabold tabular-nums">{aed(r.totalFils)}</p>
                        <div className="mt-1">
                          <OptBadge list={QUOTE_STATUSES} id={r.status} />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Created {fmtDate(r.createdAt)}
                      {r.validUntil && (
                        <>
                          {" · "}
                          <span className={overdue(r) ? "font-semibold text-red-600" : ""}>Valid until {fmtDate(r.validUntil)}</span>
                        </>
                      )}
                      {r.createdBy && ` · ${r.createdBy.name}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* tablets and up: table */}
            <div className="hidden md:block">
              <TableWrap>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th>Valid until</th>
                    <th>Created</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">
                        <Link href={`/admin/quotes/${r.id}`} className="font-bold text-brand hover:underline">
                          {r.number}
                        </Link>
                      </td>
                      <td className="max-w-[260px] truncate">{r.title || <span className="text-muted">Untitled</span>}</td>
                      <td className="max-w-[220px] truncate">{customerOf(r)}</td>
                      <td>
                        <OptBadge list={QUOTE_STATUSES} id={r.status} />
                      </td>
                      <td className="whitespace-nowrap text-right font-semibold tabular-nums">{aed(r.totalFils)}</td>
                      <td className={`whitespace-nowrap ${overdue(r) ? "font-semibold text-red-600" : "text-muted"}`}>
                        {r.validUntil ? fmtDate(r.validUntil) : "–"}
                      </td>
                      <td className="whitespace-nowrap text-muted">{fmtDate(r.createdAt)}</td>
                      <td className="whitespace-nowrap text-muted">{r.createdBy?.name ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>

            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
                <span className="text-muted">
                  Page {page} of {pages} · {matching} quotes
                </span>
                <span className="flex gap-2">
                  {page > 1 && (
                    <Link href={href({ page: String(page - 1) })} className="btn btn-outline !min-h-[40px] !px-4 text-sm">
                      Previous
                    </Link>
                  )}
                  {page < pages && (
                    <Link href={href({ page: String(page + 1) })} className="btn btn-outline !min-h-[40px] !px-4 text-sm">
                      Next
                    </Link>
                  )}
                </span>
              </nav>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
