import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Clock, MessageSquare, Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { ACTIVITY_KINDS, SOURCES, STAGES, label } from "@/lib/crm/constants";
import { aed, fmtDateTime, timeAgo } from "@/lib/crm/format";
import { Avatar, EmptyState, OptBadge, PageHeader, Panel, ScoreChip, StageBadge, StatCard } from "@/components/crm/ui";

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 86_400_000;

export default async function Dashboard(props: PageProps<"/admin">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const db = getDb()!;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const canWrite = can(user.role, "write");

  const [
    newThisWeek,
    unassigned,
    open,
    wonMonth,
    stageGroups,
    sources,
    myTasks,
    overdueCount,
    recent,
    activity,
    chatsWeek,
    acceptedQuotes,
  ] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { ownerId: null, stage: { notIn: ["won", "lost"] } } }),
    db.lead.aggregate({ where: { stage: { notIn: ["won", "lost"] } }, _sum: { valueFils: true }, _count: true }),
    db.lead.aggregate({ where: { stage: "won", closedAt: { gte: monthStart } }, _sum: { valueFils: true }, _count: true }),
    db.lead.groupBy({ by: ["stage"], _count: true, _sum: { valueFils: true } }),
    db.lead.groupBy({ by: ["source"], _count: true, where: { createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
    db.task.findMany({
      where: { completedAt: null, assigneeId: user.id },
      orderBy: { dueAt: { sort: "asc", nulls: "last" } },
      take: 6,
      include: { lead: { select: { id: true, title: true, company: true, name: true } } },
    }),
    db.task.count({ where: { completedAt: null, dueAt: { lt: now }, assigneeId: user.id } }),
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { owner: { select: { name: true } } },
    }),
    db.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { author: { select: { name: true } }, lead: { select: { id: true, title: true, company: true, name: true } } },
    }),
    db.chatSession.count({ where: { createdAt: { gte: weekAgo } } }),
    db.quote.aggregate({ where: { status: "accepted", updatedAt: { gte: monthStart } }, _sum: { totalFils: true } }),
  ]);

  const closedStage = (s: string) => stageGroups.find((g) => g.stage === s)?._count ?? 0;
  const won = closedStage("won");
  const lost = closedStage("lost");
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;
  const funnel = STAGES.map((s) => {
    const g = stageGroups.find((x) => x.stage === s.id);
    return { ...s, count: g?._count ?? 0, value: g?._sum.valueFils ?? 0 };
  });
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));
  const srcMax = Math.max(1, ...sources.map((s) => s._count));
  const firstName = user.name.split(" ")[0];

  return (
    <>
      {sp.denied && (
        <p role="alert" className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Your role doesn&apos;t have access to that page.
        </p>
      )}
      <PageHeader
        title={`Hello, ${firstName} 👋`}
        subtitle={now.toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long" })}
        actions={
          canWrite && (
            <Link href="/admin/enquiries/new" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
              <Plus size={16} /> New enquiry
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="New this week" value={newThisWeek} hint={unassigned ? `${unassigned} unassigned` : "All assigned"} href="/admin/enquiries?view=list" />
        <StatCard label="Open pipeline" value={aed(open._sum.valueFils ?? 0, { compact: true })} hint={`${open._count} open enquiries`} href="/admin/enquiries" />
        <StatCard label="Won this month" value={aed(wonMonth._sum.valueFils ?? 0, { compact: true })} hint={`${wonMonth._count} deals · ${aed(acceptedQuotes._sum.totalFils ?? 0, { compact: true })} quoted & accepted`} href="/admin/enquiries?view=list&stage=won" />
        <StatCard label="Win rate" value={winRate == null ? "—" : `${winRate}%`} hint={`${won} won · ${lost} lost, all time`} href={can(user.role, "reports") ? "/admin/reports" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Panel title="Pipeline" actions={<Link href="/admin/enquiries" className="text-sm font-bold text-brand">Open board <ArrowRight size={14} className="inline" /></Link>}>
            <ul className="space-y-3">
              {funnel.map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/enquiries?view=list&stage=${f.id}`} className="group grid grid-cols-[96px_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[120px_1fr_auto]">
                    <span className="font-semibold">{f.label}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-surface">
                      <span
                        className={`block h-full rounded-full transition-all ${
                          f.id === "won" ? "bg-emerald-500" : f.id === "lost" ? "bg-red-400" : "bg-linear-to-r from-brand to-orange"
                        }`}
                        style={{ width: `${Math.max(f.count ? 4 : 0, (f.count / maxCount) * 100)}%` }}
                      />
                    </span>
                    <span className="whitespace-nowrap text-right text-muted group-hover:text-brand">
                      <b className="text-text">{f.count}</b>
                      {f.value > 0 && <span className="ml-2 hidden sm:inline">{aed(f.value, { compact: true })}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Latest enquiries" flush actions={<Link href="/admin/enquiries?view=list" className="text-sm font-bold text-brand">View all</Link>}>
            {recent.length === 0 ? (
              <EmptyState title="No enquiries yet" body="Website, quote-form and chat enquiries land here automatically." />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/enquiries/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-surface/70">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-bold">{l.title || l.company || l.name || l.email || "Untitled enquiry"}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <OptBadge list={SOURCES} id={l.source} />
                          <span>{timeAgo(l.createdAt)}</span>
                          {l.owner ? <span>· {l.owner.name}</span> : <span className="font-semibold text-amber-700">· Unassigned</span>}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <ScoreChip score={l.score} />
                        <StageBadge stage={l.stage} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Where enquiries come from · 30 days">
            {sources.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {[...sources].sort((a, b) => b._count - a._count).map((s) => (
                  <li key={s.source} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
                    <span className="truncate font-semibold">{label(SOURCES, s.source)}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-surface">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${(s._count / srcMax) * 100}%` }} />
                    </span>
                    <b className="text-right">{s._count}</b>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel
            title={`My tasks${overdueCount ? ` · ${overdueCount} overdue` : ""}`}
            flush
            actions={<Link href="/admin/tasks" className="text-sm font-bold text-brand">All tasks</Link>}
          >
            {myTasks.length === 0 ? (
              <div className="grid place-items-center gap-2 px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={20} /></span>
                <p className="font-display font-bold">You&apos;re all caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {myTasks.map((t) => {
                  const overdue = t.dueAt && t.dueAt < now;
                  return (
                    <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${overdue ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand"}`}>
                        {overdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{t.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {t.dueAt && <span className={overdue ? "font-bold text-red-600" : ""}>{fmtDateTime(t.dueAt)}</span>}
                          {t.lead && (
                            <>
                              {" · "}
                              <Link href={`/admin/enquiries/${t.lead.id}`} className="font-semibold text-brand hover:underline">
                                {t.lead.title || t.lead.company || t.lead.name || "Enquiry"}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity" flush>
            {activity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                    <Avatar name={a.author?.name ?? "System"} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm">{a.body}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <OptBadge list={ACTIVITY_KINDS} id={a.kind} />
                        {a.lead && (
                          <Link href={`/admin/enquiries/${a.lead.id}`} className="font-semibold text-brand hover:underline">
                            {a.lead.title || a.lead.company || a.lead.name || "Enquiry"}
                          </Link>
                        )}
                        <span>· {timeAgo(a.createdAt)}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Link href="/admin/chats" className="panel flex items-center justify-between gap-4 p-5 transition hover:border-brand/30">
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><MessageSquare size={20} /></span>
              <span>
                <span className="block font-display font-bold">Website chat</span>
                <span className="text-sm text-muted">{chatsWeek} conversation{chatsWeek === 1 ? "" : "s"} this week</span>
              </span>
            </span>
            <ArrowRight size={18} className="text-brand" />
          </Link>
        </div>
      </div>
    </>
  );
}
