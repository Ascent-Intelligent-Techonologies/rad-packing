import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Check, FileText, Mail, MessageSquare, Phone, Plus, Sparkles, Trash2, UserPlus } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import {
  ACTIVITY_KINDS,
  LOST_REASONS,
  MANUAL_ACTIVITY_KINDS,
  PRODUCT_LINES,
  QUOTE_STATUSES,
  SOURCES,
  STAGES,
  TASK_KINDS,
  label,
} from "@/lib/crm/constants";
import { aed, fmtDate, fmtDateTime, nowMs, timeAgo } from "@/lib/crm/format";
import { scoreLead } from "@/lib/crm/score";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { Avatar, Badge, EmptyState, Field, OptBadge, Panel, ScoreChip, StageBadge } from "@/components/crm/ui";
import {
  addActivity,
  addTask,
  completeEnquiryTask,
  deleteEnquiry,
  linkCustomer,
  setStageForm,
  updateEnquiry,
} from "../actions";
import { EnquiryFields } from "../EnquiryFields";
import { Rich } from "./Rich";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Enquiry" };
}

const digits = (s: string) => s.replace(/[^\d]/g, "");

export default async function EnquiryDetail(props: PageProps<"/admin/enquiries/[id]">) {
  const user = await requireUser("view");
  const { id } = await props.params;
  const db = getDb()!;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      account: { select: { id: true, name: true, status: true } },
      person: { select: { id: true, name: true, jobTitle: true } },
      quotes: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }], include: { assignee: { select: { name: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 60, include: { author: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();

  const canWrite = can(user.role, "write");
  const [users, companies, contacts] = await Promise.all([
    db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
    db.contact.findMany({ select: { id: true, name: true, company: { select: { name: true } } }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const { why } = scoreLead({ ...lead, hasTranscript: !!lead.transcript });
  const transcript = (Array.isArray(lead.transcript) ? lead.transcript : []) as { role: string; content: string }[];
  const heading = lead.title || lead.company || lead.name || lead.email || "Untitled enquiry";
  const openTasks = lead.tasks.filter((t) => !t.completedAt);
  const doneTasks = lead.tasks.filter((t) => t.completedAt);
  const now = nowMs();

  return (
    <>
      <div className="mb-2">
        <Link href="/admin/enquiries" className="text-sm font-semibold text-brand hover:underline">← Enquiries</Link>
      </div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{heading}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <StageBadge stage={lead.stage} />
            <OptBadge list={[{ id: "low", label: "Low priority", tone: "slate" }, { id: "normal", label: "Normal priority", tone: "blue" }, { id: "high", label: "High priority", tone: "red" }]} id={lead.priority} />
            <span>Created {fmtDate(lead.createdAt)}</span>
            {lead.valueFils ? <span className="font-bold text-text">{aed(lead.valueFils)}</span> : null}
            {lead.expectedCloseDate && <span>· Expected close {fmtDate(lead.expectedCloseDate)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Lead score</p>
            <ScoreChip score={lead.score} />
          </div>
          {lead.owner ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold">
              <Avatar name={lead.owner.name} size={28} /> {lead.owner.name}
            </span>
          ) : (
            <Badge tone="amber">Unassigned</Badge>
          )}
        </div>
      </div>

      {/* Stage stepper */}
      <nav aria-label="Pipeline stage" className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex min-w-max gap-2">
          {STAGES.filter((s) => s.id !== "lost").map((s) => {
            const idx = STAGES.findIndex((x) => x.id === lead.stage);
            const sIdx = STAGES.findIndex((x) => x.id === s.id);
            const current = s.id === lead.stage;
            const passed = lead.stage !== "lost" && sIdx < idx;
            return (
              <li key={s.id}>
                <form action={setStageForm.bind(null, lead.id)}>
                  <input type="hidden" name="stage" value={s.id} />
                  <button
                    disabled={!canWrite || current}
                    aria-current={current ? "step" : undefined}
                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                      current
                        ? "border-transparent bg-brand text-white shadow-md"
                        : passed
                          ? "border-brand/30 bg-brand-50 text-brand"
                          : "border-line bg-white text-muted hover:border-brand/40 hover:text-brand"
                    } disabled:cursor-default`}
                  >
                    {passed && <Check size={15} strokeWidth={3} />} {s.label}
                  </button>
                </form>
              </li>
            );
          })}
          {canWrite && lead.stage !== "lost" && (
            <li>
              <details className="relative">
                <summary className="inline-flex min-h-[42px] cursor-pointer list-none items-center rounded-full border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 [&::-webkit-details-marker]:hidden">
                  Mark lost
                </summary>
                <form action={setStageForm.bind(null, lead.id)} className="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-white p-4 shadow-xl">
                  <input type="hidden" name="stage" value="lost" />
                  <Field label="Reason">
                    <select name="lostReason" className="field-sm" defaultValue={LOST_REASONS[0]}>
                      {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <button className="btn btn-brand mt-3 !min-h-[40px] w-full text-sm">Mark as lost</button>
                </form>
              </details>
            </li>
          )}
        </ol>
        {lead.stage === "lost" && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
            Lost{lead.lostReason ? `: ${lead.lostReason}` : ""}. {canWrite && "Move it to any stage above to reopen."}
          </p>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Enquiry" actions={
            <div className="flex gap-2">
              {lead.phone && <a href={`tel:${lead.phone}`} className="btn btn-outline !min-h-[36px] !px-3.5 text-sm" aria-label="Call"><Phone size={15} /> Call</a>}
              {lead.phone && <a href={`https://wa.me/${digits(lead.phone)}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-[36px] !px-3.5 text-sm">WhatsApp</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="btn btn-outline !min-h-[36px] !px-3.5 text-sm" aria-label="Email"><Mail size={15} /> Email</a>}
            </div>
          }>
            <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {[
                ["Name", lead.name],
                ["Company (as entered)", lead.company],
                ["Email", lead.email],
                ["Phone", lead.phone],
                ["Industry", lead.industry],
                ["Source", label(SOURCES, lead.source)],
                ["Interested in", lead.products.map((p) => PRODUCT_LINES.find((x) => x.id === p)?.label ?? p).join(", ")],
                ["Page", lead.pageUrl],
              ].map(([k, v]) =>
                v ? (
                  <div key={k as string}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-0.5 break-words font-medium">{v}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {lead.message && (
              <div className="mt-5 rounded-2xl bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Requirement</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">{lead.message}</p>
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-line p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <Sparkles size={14} className="text-orange" /> Why this score
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {why.map((w) => <li key={w} className="badge bg-emerald-50 text-emerald-700">+ {w}</li>)}
                {why.length === 0 && <li className="text-sm text-muted">No strong signals yet.</li>}
              </ul>
            </div>

            {canWrite && (
              <details className="group mt-5 rounded-2xl border border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-brand [&::-webkit-details-marker]:hidden">
                  Edit enquiry details <Plus size={16} className="transition group-open:rotate-45" />
                </summary>
                <div className="border-t border-line p-4">
                  <ActionForm action={updateEnquiry.bind(null, lead.id)}>
                    <EnquiryFields
                      d={lead}
                      users={users}
                      companies={companies}
                      contacts={contacts.map((c) => ({ id: c.id, name: c.name, companyName: c.company?.name ?? null }))}
                    />
                    <div className="mt-5 flex justify-end"><SubmitButton>Save changes</SubmitButton></div>
                  </ActionForm>
                </div>
              </details>
            )}
          </Panel>

          <Panel title="Customer">
            {lead.account ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand"><Building2 size={20} /></span>
                  <div>
                    <Link href={`/admin/customers/${lead.account.id}`} className="font-display text-lg font-bold text-brand hover:underline">{lead.account.name}</Link>
                    <p className="text-sm text-muted">
                      {lead.person ? `${lead.person.name}${lead.person.jobTitle ? ` · ${lead.person.jobTitle}` : ""}` : "No contact linked"}
                    </p>
                  </div>
                </div>
                <Badge tone={lead.account.status === "active" ? "green" : "amber"}>{lead.account.status}</Badge>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">Not linked to a customer record yet.</p>
                {canWrite && (
                  <Link href={`/admin/customers/new?fromLead=${lead.id}`} className="btn btn-brand !min-h-[40px] !px-4 text-sm">
                    <UserPlus size={16} /> Create customer from this enquiry
                  </Link>
                )}
              </div>
            )}
            {canWrite && (
              <form action={linkCustomer.bind(null, lead.id)} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field label="Link to existing customer">
                  <select name="companyId" defaultValue={lead.companyId ?? ""} className="field-sm">
                    <option value="">None</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Contact">
                  <select name="contactId" defaultValue={lead.contactId ?? ""} className="field-sm">
                    <option value="">None</option>
                    {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company.name}` : ""}</option>)}
                  </select>
                </Field>
                <button className="btn btn-outline !min-h-[42px] !px-4 text-sm">Save link</button>
              </form>
            )}
          </Panel>

          <Panel
            title="Quotes"
            actions={canWrite && (
              <Link href={`/admin/quotes/new?leadId=${lead.id}`} className="btn btn-brand !min-h-[36px] !px-3.5 text-sm"><Plus size={15} /> New quote</Link>
            )}
            flush
          >
            {lead.quotes.length === 0 ? (
              <EmptyState title="No quotes yet" body="Create a quotation from the price list and send it to the customer." />
            ) : (
              <ul className="divide-y divide-line">
                {lead.quotes.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <Link href={`/admin/quotes/${q.id}`} className="flex items-center gap-3 font-bold text-brand hover:underline">
                      <FileText size={17} /> {q.number}
                    </Link>
                    <span className="flex items-center gap-3">
                      <OptBadge list={QUOTE_STATUSES} id={q.status} />
                      <span className="font-bold">{aed(q.totalFils)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {transcript.length > 0 && (
            <Panel title={<span className="inline-flex items-center gap-2"><MessageSquare size={16} className="text-brand" /> Chat transcript</span>}>
              <div className="space-y-3">
                {transcript.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-brand text-white" : "bg-surface"}`}>
                      <Rich text={m.content} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {can(user.role, "delete") && (
            <form action={deleteEnquiry.bind(null, lead.id)} className="flex justify-end">
              <ConfirmButton message="Delete this enquiry and its tasks and timeline? This cannot be undone.">
                <Trash2 size={15} /> Delete enquiry
              </ConfirmButton>
            </form>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title={`Tasks${openTasks.length ? ` (${openTasks.length})` : ""}`} flush>
            {openTasks.length === 0 && doneTasks.length === 0 && <p className="px-5 py-6 text-center text-sm text-muted">No tasks yet.</p>}
            <ul className="divide-y divide-line">
              {[...openTasks, ...doneTasks.slice(0, 3)].map((t) => {
                const overdue = !t.completedAt && t.dueAt && t.dueAt.getTime() < now;
                return (
                  <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                    <form action={completeEnquiryTask.bind(null, t.id, lead.id)}>
                      <input type="hidden" name="done" value={t.completedAt ? "0" : "1"} />
                      <button
                        disabled={!canWrite}
                        aria-label={t.completedAt ? "Mark as not done" : "Mark as done"}
                        className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full border-2 transition ${
                          t.completedAt ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-brand"
                        }`}
                      >
                        {t.completedAt && <Check size={13} strokeWidth={3} />}
                      </button>
                    </form>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${t.completedAt ? "text-muted line-through" : ""}`}>{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span>{label(TASK_KINDS, t.kind)}</span>
                        {t.dueAt && <span className={overdue ? "font-bold text-red-600" : ""}>{overdue ? "Overdue · " : ""}{fmtDateTime(t.dueAt)}</span>}
                        {t.assignee && <span>· {t.assignee.name}</span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {canWrite && (
              <details className="group border-t border-line">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-bold text-brand [&::-webkit-details-marker]:hidden">
                  <Plus size={16} className="transition group-open:rotate-45" /> Add task
                </summary>
                <ActionForm action={addTask.bind(null, lead.id)} resetOnSuccess className="grid gap-3 px-5 pb-5">
                  <Field label="Task"><input name="title" required className="field-sm" placeholder="e.g. Send quotation" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <select name="kind" className="field-sm">
                        {TASK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Assign to">
                      <select name="assigneeId" defaultValue={user.id} className="field-sm">
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Due"><input name="dueAt" type="datetime-local" className="field-sm" /></Field>
                  <SubmitButton>Add task</SubmitButton>
                </ActionForm>
              </details>
            )}
          </Panel>

          <Panel title="Activity" flush>
            {canWrite && (
              <ActionForm action={addActivity.bind(null, lead.id)} resetOnSuccess className="border-b border-line p-5">
                <div className="grid gap-3">
                  <select name="kind" className="field-sm" aria-label="Activity type" defaultValue="note">
                    {MANUAL_ACTIVITY_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                  </select>
                  <textarea name="body" required rows={3} className="field-sm" placeholder="Log a call, note or meeting…" aria-label="Activity details" />
                  <SubmitButton>Log activity</SubmitButton>
                </div>
              </ActionForm>
            )}
            {lead.activities.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted">Nothing logged yet.</p>
            ) : (
              <ol className="relative space-y-5 px-5 py-5 before:absolute before:bottom-6 before:left-[29px] before:top-6 before:w-px before:bg-line">
                {lead.activities.map((a) => (
                  <li key={a.id} className="relative flex gap-3">
                    <span className="z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-white bg-brand-50 ring-1 ring-line">
                      <span className={`h-2 w-2 rounded-full ${a.kind === "stage_change" ? "bg-orange" : a.kind === "system" ? "bg-slate-400" : "bg-brand"}`} />
                    </span>
                    <div className="min-w-0 flex-1 -mt-0.5">
                      <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <OptBadge list={ACTIVITY_KINDS} id={a.kind} />
                        <span>{a.author?.name ?? "System"}</span>
                        <span title={fmtDateTime(a.createdAt)}>· {timeAgo(a.createdAt)}</span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
