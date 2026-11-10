import type { Metadata } from "next";
import Link from "next/link";
import { Download, KanbanSquare, List, Plus, Search } from "lucide-react";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { PRIORITIES, SOURCES, STAGES } from "@/lib/crm/constants";
import { aed, nowMs, timeAgo } from "@/lib/crm/format";
import { Avatar, EmptyState, OptBadge, PageHeader, Panel, ScoreChip, StageBadge, TableWrap } from "@/components/crm/ui";
import { Board, type BoardCard } from "./Board";

export const metadata: Metadata = { title: "Enquiries" };

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function EnquiriesPage(props: PageProps<"/admin/enquiries">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const view = str(sp.view) === "list" ? "list" : "board";
  const q = str(sp.q).trim();
  const owner = str(sp.owner);
  const source = str(sp.source);
  const priority = str(sp.priority);
  const stage = str(sp.stage);
  const canWrite = can(user.role, "write");
  const db = getDb()!;

  const and: Prisma.LeadWhereInput[] = [];
  if (q) {
    and.push({
      OR: ["title", "name", "company", "email", "phone", "message"].map((f) => ({
        [f]: { contains: q, mode: "insensitive" },
      })) as Prisma.LeadWhereInput[],
    });
  }
  if (owner === "me") and.push({ ownerId: user.id });
  else if (owner === "none") and.push({ ownerId: null });
  else if (owner) and.push({ ownerId: owner });
  if (source) and.push({ source });
  if (priority) and.push({ priority });
  if (stage) and.push({ stage });
  if (view === "board" && !stage) {
    const since = new Date(nowMs() - 90 * 86_400_000);
    and.push({ OR: [{ stage: { notIn: ["won", "lost"] } }, { closedAt: { gte: since } }, { closedAt: null }] });
  }

  const [leads, users, totals] = await Promise.all([
    db.lead.findMany({
      where: { AND: and },
      orderBy: [{ updatedAt: "desc" }],
      take: 400,
      include: {
        owner: { select: { name: true } },
        account: { select: { name: true } },
        tasks: { where: { completedAt: null, dueAt: { lt: new Date() } }, select: { id: true }, take: 1 },
      },
    }),
    db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.lead.aggregate({ where: { stage: { notIn: ["won", "lost"] } }, _sum: { valueFils: true }, _count: true }),
  ]);

  const cards: BoardCard[] = leads.map((l) => ({
    id: l.id,
    title: l.title || l.company || l.name || l.email || "Untitled enquiry",
    sub: [l.name, l.account?.name ?? l.company].filter(Boolean).join(" · "),
    stage: l.stage,
    valueFils: l.valueFils,
    score: l.score,
    priority: l.priority,
    source: l.source,
    owner: l.owner?.name ?? null,
    ageDays: Math.floor((nowMs() - l.createdAt.getTime()) / 86_400_000),
    overdueTask: l.tasks.length > 0,
  }));

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string> = { view, q, owner, source, priority, stage, ...over };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    return `/admin/enquiries?${p.toString()}`;
  };
  const filtered = !!(q || owner || source || priority || stage);

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle={`${totals._count} open · ${aed(totals._sum.valueFils ?? 0, { compact: true })} in the pipeline`}
        actions={
          <>
            {can(user.role, "reports") && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not a page
              <a href="/admin/export/enquiries" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
                <Download size={16} /> Export CSV
              </a>
            )}
            {canWrite && (
              <Link href="/admin/enquiries/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
                <Plus size={16} /> New enquiry
              </Link>
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="View">
          <Link href={qs({ view: "board" })} aria-current={view === "board"} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${view === "board" ? "bg-brand text-white" : "text-muted"}`}>
            <KanbanSquare size={16} /> Board
          </Link>
          <Link href={qs({ view: "list" })} aria-current={view === "list"} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${view === "list" ? "bg-brand text-white" : "text-muted"}`}>
            <List size={16} /> List
          </Link>
        </div>

        <form className="flex flex-1 flex-wrap items-center gap-2" action="/admin/enquiries">
          <input type="hidden" name="view" value={view} />
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search enquiries</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search name, company, email, phone…" className="field-sm !pl-10" />
          </label>
          <select name="owner" defaultValue={owner} className="field-sm !w-auto" aria-label="Owner">
            <option value="">Everyone</option>
            <option value="me">My enquiries</option>
            <option value="none">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select name="source" defaultValue={source} className="field-sm !w-auto" aria-label="Source">
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select name="priority" defaultValue={priority} className="field-sm !w-auto" aria-label="Priority">
            <option value="">Any priority</option>
            {PRIORITIES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          {view === "list" && (
            <select name="stage" defaultValue={stage} className="field-sm !w-auto" aria-label="Stage">
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          )}
          <button className="btn btn-outline !min-h-[42px] !px-4 text-sm">Apply</button>
          {filtered && (
            <Link href={`/admin/enquiries?view=${view}`} className="text-sm font-semibold text-brand underline">
              Clear
            </Link>
          )}
        </form>
      </div>

      {leads.length === 0 ? (
        <Panel>
          <EmptyState
            title={filtered ? "No enquiries match those filters" : "No enquiries yet"}
            body={filtered ? "Try clearing a filter." : "Enquiries from the website form, the website chat and the quote form land here automatically."}
            action={canWrite && <Link href="/admin/enquiries/new" className="btn btn-brand !min-h-[42px] text-sm">New enquiry</Link>}
          />
        </Panel>
      ) : view === "board" ? (
        <Board cards={cards} canWrite={canWrite} />
      ) : (
        <Panel flush>
          <TableWrap>
            <thead>
              <tr>
                <th>Enquiry</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Score</th>
                <th>Owner</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="max-w-[280px]">
                    <Link href={`/admin/enquiries/${l.id}`} className="font-bold text-brand hover:underline">
                      {l.title || l.company || l.name || l.email || "Untitled enquiry"}
                    </Link>
                    {l.priority === "high" && <span className="ml-2 text-xs font-bold text-red-600">High</span>}
                  </td>
                  <td className="text-muted">{[l.name, l.account?.name ?? l.company].filter(Boolean).join(" · ") || "—"}</td>
                  <td><OptBadge list={SOURCES} id={l.source} /></td>
                  <td><StageBadge stage={l.stage} /></td>
                  <td className="whitespace-nowrap font-semibold">{l.valueFils ? aed(l.valueFils, { compact: true }) : "—"}</td>
                  <td><ScoreChip score={l.score} /></td>
                  <td>
                    {l.owner ? (
                      <span className="inline-flex items-center gap-2"><Avatar name={l.owner.name} size={26} /> {l.owner.name.split(" ")[0]}</span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-muted">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
