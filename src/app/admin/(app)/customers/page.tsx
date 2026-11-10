import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Download, Plus, Search } from "lucide-react";
import { Pager } from "@/components/crm/customers/Pager";
import { OwnerSelect } from "@/components/crm/customers/fields";
import { EmptyState, Field, OptBadge, PageHeader, Panel, TableWrap } from "@/components/crm/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/crm/auth";
import { COMPANY_STATUSES } from "@/lib/crm/constants";
import { staffOptions } from "@/lib/crm/customers-data";
import { aed, fmtDate } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 25;
const SORTS = [
  { id: "activity", label: "Recent activity" },
  { id: "name", label: "Name (A–Z)" },
  { id: "created", label: "Newest first" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const db = getDb()!;

  const q = one(sp.q).trim().slice(0, 100);
  const status = COMPANY_STATUSES.some((s) => s.id === one(sp.status)) ? one(sp.status) : "";
  const owner = one(sp.owner).slice(0, 60);
  const sort = SORTS.some((s) => s.id === one(sp.sort)) ? one(sp.sort) : "activity";
  const page = Math.max(1, Math.min(10_000, parseInt(one(sp.page), 10) || 1));

  const where: Prisma.CompanyWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { tags: { hasSome: [q, q.toLowerCase()] } },
              {
                contacts: {
                  some: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
                },
              },
            ],
          }
        : {},
      status ? { status } : {},
      owner === "unassigned" ? { ownerId: null } : owner ? { ownerId: owner } : {},
    ],
  };

  const total = await db.company.count({ where });
  const skip = (page - 1) * PAGE_SIZE;

  // 1. work out the ids on this page, in order
  let pageIds: string[];
  if (sort === "activity") {
    const [rows, last] = await Promise.all([
      db.company.findMany({ where, select: { id: true, createdAt: true } }),
      db.activity.groupBy({ by: ["companyId"], where: { company: where }, _max: { createdAt: true } }),
    ]);
    const lastAt = new Map(last.map((l) => [l.companyId, l._max.createdAt?.getTime() ?? 0]));
    pageIds = rows
      .map((r) => ({ id: r.id, at: Math.max(lastAt.get(r.id) ?? 0, r.createdAt.getTime()) }))
      .sort((a, b) => b.at - a.at)
      .slice(skip, skip + PAGE_SIZE)
      .map((r) => r.id);
  } else {
    const rows = await db.company.findMany({
      where,
      select: { id: true },
      orderBy: sort === "name" ? [{ name: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: PAGE_SIZE,
    });
    pageIds = rows.map((r) => r.id);
  }

  // 2. details for those rows
  const [companies, wonRows, users] = await Promise.all([
    db.company.findMany({
      where: { id: { in: pageIds } },
      include: {
        owner: { select: { name: true } },
        _count: { select: { contacts: true, leads: { where: { stage: { notIn: ["won", "lost"] } } } } },
      },
    }),
    db.lead.groupBy({ by: ["companyId"], where: { companyId: { in: pageIds }, stage: "won" }, _sum: { valueFils: true } }),
    staffOptions(owner && owner !== "unassigned" ? owner : null),
  ]);
  const byId = new Map(companies.map((c) => [c.id, c]));
  const rows = pageIds.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  const won = new Map(wonRows.map((w) => [w.companyId, w._sum.valueFils ?? 0]));

  const canWrite = can(user.role, "write");
  const canExport = can(user.role, "reports");
  const filtered = Boolean(q || status || owner);
  const filterParams = { q, status, owner, sort: sort === "activity" ? "" : sort };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${total} ${total === 1 ? "company" : "companies"}${filtered ? " match your filters" : ""}`}
        actions={
          <>
            {canExport && (
              // file download from a route handler, not a page: a plain anchor is correct
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/admin/export/customers" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
                <Download size={16} /> Export CSV
              </a>
            )}
            {canWrite && (
              <Link href="/admin/customers/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
                <Plus size={16} /> New customer
              </Link>
            )}
          </>
        }
      />

      <form
        role="search"
        className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end"
      >
        <Field label="Search" className="sm:col-span-2 lg:col-span-1">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name, city, industry, email, tag…"
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={status} className="field-sm">
            <option value="">All statuses</option>
            {COMPANY_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <OwnerSelect users={users} value={owner} name="owner" mode="filter" />
        <Field label="Sort by">
          <select name="sort" defaultValue={sort} className="field-sm">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
            <Search size={16} /> Apply
          </button>
          {filtered && (
            <Link href="/admin/customers" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
              Clear
            </Link>
          )}
        </div>
      </form>

      <Panel flush>
        {rows.length === 0 ? (
          <EmptyState
            title={filtered ? "No customers match" : "No customers yet"}
            body={filtered ? "Try a different search or clear the filters." : "Add your first customer, or convert an enquiry into one."}
            action={
              canWrite && !filtered ? (
                <Link href="/admin/customers/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
                  <Plus size={16} /> New customer
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/customers/${c.id}`} className="block px-4 py-3.5 active:bg-brand-50/40">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 font-bold">
                        <Building2 size={16} className="shrink-0 text-brand" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <OptBadge list={COMPANY_STATUSES} id={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{[c.industry, c.city].filter(Boolean).join(" · ") || "No industry or city"}</p>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>{c.owner?.name ?? "Unassigned"}</span>
                      <span>
                        {c._count.contacts} contact{c._count.contacts === 1 ? "" : "s"}
                      </span>
                      <span>
                        {c._count.leads} open enquir{c._count.leads === 1 ? "y" : "ies"}
                      </span>
                      {(won.get(c.id) ?? 0) > 0 && (
                        <span className="font-semibold text-emerald-700">Won {aed(won.get(c.id), { compact: true })}</span>
                      )}
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
                    <th>Customer</th>
                    <th>Industry</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th className="text-right">Contacts</th>
                    <th className="text-right">Open enquiries</th>
                    <th className="text-right">Won value</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-[260px]">
                        <Link href={`/admin/customers/${c.id}`} className="block truncate font-bold text-brand hover:underline">
                          {c.name}
                        </Link>
                        {c.tags.length > 0 && <span className="block truncate text-xs text-muted">{c.tags.join(" · ")}</span>}
                      </td>
                      <td className="text-muted">{c.industry ?? "—"}</td>
                      <td className="text-muted">{c.city ?? "—"}</td>
                      <td>
                        <OptBadge list={COMPANY_STATUSES} id={c.status} />
                      </td>
                      <td>{c.owner?.name ?? <span className="text-muted">Unassigned</span>}</td>
                      <td className="text-right tabular-nums">{c._count.contacts}</td>
                      <td className="text-right tabular-nums">{c._count.leads}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {(won.get(c.id) ?? 0) > 0 ? aed(won.get(c.id)) : <span className="text-muted">—</span>}
                      </td>
                      <td className="whitespace-nowrap text-muted">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
            <Pager basePath="/admin/customers" params={filterParams} page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </Panel>
    </>
  );
}
