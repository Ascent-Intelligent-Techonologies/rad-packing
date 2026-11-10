import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { PRIORITIES, TASK_KINDS } from "@/lib/crm/constants";
import { fmtDate, fmtDateTime, toDateTimeInput } from "@/lib/crm/format";
import { Avatar, EmptyState, OptBadge, PageHeader, Panel, TableWrap } from "@/components/crm/ui";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { createTask, deleteTask, setTaskDone, updateTask } from "./actions";
import { TaskFields } from "./TaskFields";

export const metadata: Metadata = { title: "Tasks" };

const VIEWS = [
  { id: "mine", label: "My tasks" },
  { id: "all-open", label: "All open" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due today" },
  { id: "done", label: "Done" },
] as const;
type View = (typeof VIEWS)[number]["id"];

type TaskItem = {
  id: string;
  title: string;
  notes: string | null;
  kind: string;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  lead: { id: string; title: string | null; name: string | null; company: string | null } | null;
  company: { id: string; name: string } | null;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TasksPage(props: PageProps<"/admin/tasks">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const db = getDb()!;

  const canWrite = can(user.role, "write");
  const canDelete = can(user.role, "delete");

  // ── time boundaries (Dubai, UTC+4) ──────────────────────────────
  const now = new Date();
  const DUBAI = 4 * 3600_000;
  const dayStart = new Date(Math.floor((now.getTime() + DUBAI) / 86_400_000) * 86_400_000 - DUBAI);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  // ── filters from the URL ────────────────────────────────────────
  const viewParam = first(sp.view);
  const view: View = VIEWS.some((v) => v.id === viewParam) ? (viewParam as View) : "mine";
  const kindParam = first(sp.kind);
  const kind = TASK_KINDS.some((k) => k.id === kindParam) ? kindParam : undefined;

  const [users, companyRows] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, active: true }, orderBy: { name: "asc" } }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const assigneeParam = first(sp.assignee);
  const assignee =
    assigneeParam === "none" ? "none" : users.some((u) => u.id === assigneeParam) ? assigneeParam : undefined;

  // ── pre-link (?leadId= / ?companyId=) and edit (?edit=) ─────────
  const leadIdParam = first(sp.leadId);
  const prefillLead = canWrite && leadIdParam
    ? await db.lead.findUnique({
        where: { id: leadIdParam },
        select: { id: true, title: true, name: true, company: true, companyId: true },
      })
    : null;
  const companyIdParam = first(sp.companyId) ?? prefillLead?.companyId ?? undefined;

  const editId = canWrite ? first(sp.edit) : undefined;
  const editing = editId
    ? await db.task.findUnique({
        where: { id: editId },
        select: {
          id: true,
          title: true,
          notes: true,
          kind: true,
          priority: true,
          dueAt: true,
          assigneeId: true,
          companyId: true,
          lead: { select: { id: true, title: true, name: true } },
        },
      })
    : null;

  const wantedCompanyIds = [companyIdParam, editing?.companyId].filter((x): x is string => !!x);
  const missing = wantedCompanyIds.filter((id) => !companyRows.some((c) => c.id === id));
  const extraCompanies = missing.length
    ? await db.company.findMany({ where: { id: { in: missing } }, select: { id: true, name: true } })
    : [];
  const companies = [...companyRows, ...extraCompanies].sort((a, b) => a.name.localeCompare(b.name));
  const prefillCompanyId = companies.some((c) => c.id === companyIdParam) ? companyIdParam : undefined;

  // ── queries ─────────────────────────────────────────────────────
  const whereFor = (v: View): Prisma.TaskWhereInput => {
    const and: Prisma.TaskWhereInput[] = [];
    if (kind) and.push({ kind });
    if (v === "mine") and.push({ assigneeId: user.id });
    else if (assignee === "none") and.push({ assigneeId: null });
    else if (assignee) and.push({ assigneeId: assignee });
    if (v === "done") and.push({ completedAt: { not: null } });
    else and.push({ completedAt: null });
    if (v === "overdue") and.push({ dueAt: { lt: now } });
    if (v === "today") and.push({ dueAt: { gte: dayStart, lt: dayEnd } });
    return { AND: and };
  };

  const [counts, tasks] = await Promise.all([
    Promise.all(VIEWS.map((v) => db.task.count({ where: whereFor(v.id) }))),
    db.task.findMany({
      where: whereFor(view),
      orderBy:
        view === "done"
          ? [{ completedAt: "desc" }]
          : [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        notes: true,
        kind: true,
        priority: true,
        dueAt: true,
        completedAt: true,
        assigneeId: true,
        assignee: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true, name: true, company: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = { view, assignee, kind, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin/tasks?${qs}` : "/admin/tasks";
  };

  const newOpen = canWrite && (first(sp.new) === "1" || !!prefillLead || !!first(sp.companyId));
  const activeUsers = users.filter((u) => u.active);
  const filtered = !!kind || (!!assignee && view !== "mine");

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Follow-ups, calls, site visits and everything else your team has to do."
        actions={
          canWrite && !newOpen && !editing ? (
            <Link href="/admin/tasks?new=1" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
              <Plus size={16} /> New task
            </Link>
          ) : undefined
        }
      />

      {first(sp.added) === "1" && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          Task added.
        </p>
      )}
      {first(sp.saved) === "1" && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          Task updated.
        </p>
      )}

      {/* ── edit ─────────────────────────────────────────────── */}
      {editing && (
        <Panel title="Edit task" className="mb-6">
          {editing.lead && (
            <p className="mb-4 text-sm text-muted">
              Linked enquiry:{" "}
              <Link href={`/admin/enquiries/${editing.lead.id}`} className="font-semibold text-brand hover:underline">
                {editing.lead.title ?? editing.lead.name ?? "Enquiry"}
              </Link>
            </p>
          )}
          <ActionForm action={updateTask}>
            <TaskFields
              users={users.filter((u) => u.active || u.id === editing.assigneeId)}
              companies={companies}
              defaults={{
                id: editing.id,
                title: editing.title,
                notes: editing.notes,
                kind: editing.kind,
                priority: editing.priority,
                dueAt: toDateTimeInput(editing.dueAt),
                assigneeId: editing.assigneeId,
                companyId: editing.companyId,
              }}
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <SubmitButton>Save changes</SubmitButton>
              <Link href={href({})} className="btn btn-outline !min-h-[42px] !px-5 text-sm">
                Cancel
              </Link>
            </div>
          </ActionForm>
        </Panel>
      )}

      {/* ── new ──────────────────────────────────────────────── */}
      {canWrite && !editing && (
        <details open={newOpen} className="panel group mb-6">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 px-5 py-3 font-display text-[15px] font-bold [&::-webkit-details-marker]:hidden">
            <Plus size={16} className="text-brand transition group-open:rotate-45" /> New task
          </summary>
          <div className="border-t border-line p-5">
            {prefillLead && (
              <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-text">
                This task will be linked to the enquiry{" "}
                <Link href={`/admin/enquiries/${prefillLead.id}`} className="font-semibold text-brand hover:underline">
                  {prefillLead.title ?? prefillLead.name ?? "Enquiry"}
                </Link>
                .
              </p>
            )}
            <ActionForm action={createTask} resetOnSuccess>
              <TaskFields
                users={activeUsers}
                companies={companies}
                defaults={{
                  assigneeId: user.id,
                  companyId: prefillCompanyId,
                  leadId: prefillLead?.id,
                }}
              />
              <div className="mt-5">
                <SubmitButton pendingLabel="Adding…">Add task</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </details>
      )}

      {/* ── tabs ─────────────────────────────────────────────── */}
      <nav aria-label="Task views" className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((v, i) => {
          const active = v.id === view;
          return (
            <Link
              key={v.id}
              href={href({ view: v.id })}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-text hover:border-brand hover:text-brand"
              }`}
            >
              {v.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : v.id === "overdue" && counts[i]! > 0
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {counts[i]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── filters ──────────────────────────────────────────── */}
      <form action="/admin/tasks" className="mb-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="view" value={view} />
        {view !== "mine" && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold">Assigned to</span>
            <select name="assignee" defaultValue={assignee ?? ""} className="field-sm !w-auto min-w-[160px]">
              <option value="">Everyone</option>
              <option value="none">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-bold">Type</span>
          <select name="kind" defaultValue={kind ?? ""} className="field-sm !w-auto min-w-[140px]">
            <option value="">All types</option>
            {TASK_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-outline !min-h-[42px] !px-5 text-sm">
          Apply
        </button>
        {filtered && (
          <Link href={href({ assignee: undefined, kind: undefined })} className="inline-flex min-h-[42px] items-center px-2 text-sm font-semibold text-brand hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      {/* ── list ─────────────────────────────────────────────── */}
      {tasks.length === 0 ? (
        <Panel>
          <EmptyState
            title={view === "done" ? "Nothing completed yet" : view === "overdue" ? "Nothing overdue" : "No tasks here"}
            body={
              filtered
                ? "No tasks match these filters."
                : view === "mine"
                  ? "You're all caught up. Add a task to keep track of a follow-up."
                  : "Tasks that match this view will appear here."
            }
          />
        </Panel>
      ) : (
        <>
          {/* phones: stacked cards */}
          <ul className="space-y-3 md:hidden">
            {tasks.map((t) => (
              <li key={t.id} className="panel flex gap-3 p-4">
                <Toggle task={t} canWrite={canWrite} />
                <div className="min-w-0 flex-1">
                  <TaskTitle task={t} />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <OptBadge list={TASK_KINDS} id={t.kind} />
                    <OptBadge list={PRIORITIES} id={t.priority} />
                  </div>
                  <p className="mt-2 text-sm">
                    <Due task={t} now={now} dayStart={dayStart} dayEnd={dayEnd} />
                  </p>
                  <Links task={t} />
                  {t.assignee && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                      <Avatar name={t.assignee.name} size={22} /> {t.assignee.name}
                    </p>
                  )}
                  <Actions task={t} canWrite={canWrite} canDelete={canDelete} meId={user.id} href={href} />
                </div>
              </li>
            ))}
          </ul>

          {/* desktop: table */}
          <div className="panel hidden overflow-hidden md:block">
            <TableWrap>
              <thead>
                <tr>
                  <th className="w-12">
                    <span className="sr-only">Done</span>
                  </th>
                  <th>Task</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>{view === "done" ? "Completed" : "Due"}</th>
                  <th>Assigned to</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Toggle task={t} canWrite={canWrite} />
                    </td>
                    <td className="max-w-[420px]">
                      <TaskTitle task={t} />
                      <Links task={t} />
                    </td>
                    <td>
                      <OptBadge list={TASK_KINDS} id={t.kind} />
                    </td>
                    <td>
                      <OptBadge list={PRIORITIES} id={t.priority} />
                    </td>
                    <td className="whitespace-nowrap">
                      {view === "done" ? (
                        <span className="text-muted">{fmtDate(t.completedAt)}</span>
                      ) : (
                        <Due task={t} now={now} dayStart={dayStart} dayEnd={dayEnd} />
                      )}
                    </td>
                    <td>
                      {t.assignee ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={t.assignee.name} size={26} />
                          <span className="whitespace-nowrap">{t.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <Actions task={t} canWrite={canWrite} canDelete={canDelete} meId={user.id} href={href} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
          {tasks.length >= 200 && <p className="mt-3 text-center text-xs text-muted">Showing the first 200 tasks. Use the filters to narrow the list.</p>}
        </>
      )}
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────── */

function Toggle({ task, canWrite }: { task: TaskItem; canWrite: boolean }) {
  const done = !!task.completedAt;
  const Icon = done ? CheckCircle2 : Circle;
  const icon = <Icon size={26} className={done ? "text-emerald-600" : "text-slate-400"} aria-hidden="true" />;
  if (!canWrite) return <span className="grid h-10 w-10 shrink-0 place-items-center">{icon}</span>;
  return (
    <form action={setTaskDone} className="shrink-0">
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="done" value={done ? "0" : "1"} />
      <button
        type="submit"
        aria-label={done ? `Mark not done: ${task.title}` : `Mark done: ${task.title}`}
        title={done ? "Mark not done" : "Mark done"}
        className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-brand-50"
      >
        {icon}
      </button>
    </form>
  );
}

function TaskTitle({ task }: { task: TaskItem }) {
  const done = !!task.completedAt;
  return (
    <>
      <p className={`break-words font-semibold leading-snug ${done ? "text-muted line-through" : ""}`}>{task.title}</p>
      {task.notes && <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted">{task.notes}</p>}
    </>
  );
}

function Due({ task, now, dayStart, dayEnd }: { task: TaskItem; now: Date; dayStart: Date; dayEnd: Date }) {
  if (task.completedAt) {
    return <span className="text-muted">Completed {fmtDate(task.completedAt)}</span>;
  }
  if (!task.dueAt) return <span className="text-muted">No due date</span>;
  const overdue = task.dueAt < now;
  const today = !overdue && task.dueAt >= dayStart && task.dueAt < dayEnd;
  return (
    <span className={overdue ? "font-semibold text-red-600" : today ? "font-semibold text-amber-700" : "text-text"}>
      {fmtDateTime(task.dueAt)}
      {overdue && <span className="ml-1.5 text-xs font-bold uppercase tracking-wide">Overdue</span>}
      {today && <span className="ml-1.5 text-xs font-bold uppercase tracking-wide">Today</span>}
    </span>
  );
}

function Links({ task }: { task: TaskItem }) {
  if (!task.lead && !task.company) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {task.lead && (
        <Link
          href={`/admin/enquiries/${task.lead.id}`}
          className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand hover:underline"
        >
          <span className="truncate">Enquiry: {task.lead.title ?? task.lead.name ?? task.lead.company ?? "Untitled"}</span>
        </Link>
      )}
      {task.company && (
        <Link
          href={`/admin/customers/${task.company.id}`}
          className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:underline"
        >
          <span className="truncate">Customer: {task.company.name}</span>
        </Link>
      )}
    </div>
  );
}

function Actions({
  task,
  canWrite,
  canDelete,
  meId,
  href,
}: {
  task: TaskItem;
  canWrite: boolean;
  canDelete: boolean;
  meId: string;
  href: (over: Record<string, string | undefined>) => string;
}) {
  if (!canWrite) return null;
  const mayDelete = canDelete || task.assigneeId === meId;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0 md:justify-end">
      <Link
        href={href({ edit: task.id })}
        className="btn btn-outline !min-h-[40px] !gap-1.5 !px-3.5 text-sm"
        aria-label={`Edit task: ${task.title}`}
      >
        <Pencil size={14} /> Edit
      </Link>
      {mayDelete && (
        <form action={deleteTask}>
          <input type="hidden" name="id" value={task.id} />
          <ConfirmButton
            message={`Delete the task "${task.title}"? This cannot be undone.`}
            className="btn btn-outline !min-h-[40px] !gap-1.5 !px-3.5 text-sm !text-red-600 hover:!border-red-300"
          >
            <Trash2 size={14} /> <span>Delete</span>
            <span className="sr-only"> task: {task.title}</span>
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
