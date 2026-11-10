import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { ContactsPanel } from "@/components/crm/customers/ContactsPanel";
import { Disclosure } from "@/components/crm/customers/Disclosure";
import { CompanyFields } from "@/components/crm/customers/fields";
import { KeepForm } from "@/components/crm/customers/KeepForm";
import { TasksPanel } from "@/components/crm/customers/TasksPanel";
import { TimelinePanel } from "@/components/crm/customers/TimelinePanel";
import { ConfirmButton } from "@/components/crm/forms";
import { Avatar, Badge, OptBadge, PageHeader, Panel, StageBadge } from "@/components/crm/ui";
import { requireUser } from "@/lib/crm/auth";
import { COMPANY_STATUSES, QUOTE_STATUSES, STAGES } from "@/lib/crm/constants";
import { prettyUrl, telHref, webHref } from "@/lib/crm/customers";
import { staffOptions } from "@/lib/crm/customers-data";
import { aed, fmtDate, timeAgo } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";
import { deleteCustomer, updateCustomer } from "../actions";

export const metadata: Metadata = { title: "Customer" };

const OPEN_STAGES: string[] = STAGES.filter((s) => s.open).map((s) => s.id);
const LIST_LIMIT = 25;

export default async function CustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const user = await requireUser("view");
  const { id } = await props.params;
  const db = getDb()!;

  const company = await db.company.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true } }, contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] } },
  });
  if (!company) notFound();

  const [leads, leadStats, quotes, quoteStats, tasks, activities, staff, ownerOptions] = await Promise.all([
    db.lead.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: { owner: { select: { name: true } } },
    }),
    db.lead.groupBy({ by: ["stage"], where: { companyId: id }, _sum: { valueFils: true }, _count: { _all: true } }),
    db.quote.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: { id: true, number: true, status: true, title: true, totalFils: true, createdAt: true },
    }),
    db.quote.groupBy({ by: ["status"], where: { companyId: id }, _count: { _all: true } }),
    db.task.findMany({
      where: { companyId: id, completedAt: null },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      include: { assignee: { select: { name: true } } },
    }),
    db.activity.findMany({
      where: { OR: [{ companyId: id }, { contact: { companyId: id } }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { name: true } }, contact: { select: { name: true } } },
    }),
    staffOptions(),
    staffOptions(company.ownerId),
  ]);

  const canWrite = can(user.role, "write");
  const canDelete = can(user.role, "delete");

  const wonValue = leadStats.filter((s) => s.stage === "won").reduce((n, s) => n + (s._sum.valueFils ?? 0), 0);
  const wonCount = leadStats.filter((s) => s.stage === "won").reduce((n, s) => n + s._count._all, 0);
  const pipelineValue = leadStats.filter((s) => OPEN_STAGES.includes(s.stage)).reduce((n, s) => n + (s._sum.valueFils ?? 0), 0);
  const openCount = leadStats.filter((s) => OPEN_STAGES.includes(s.stage)).reduce((n, s) => n + s._count._all, 0);
  const leadTotal = leadStats.reduce((n, s) => n + s._count._all, 0);
  const quoteTotal = quoteStats.reduce((n, s) => n + s._count._all, 0);
  const quotesAccepted = quoteStats.find((s) => s.status === "accepted")?._count._all ?? 0;
  const lastActivity = activities[0]?.createdAt;

  const defaultAssignee = company.ownerId && staff.some((u) => u.id === company.ownerId) ? company.ownerId : user.id;
  const place = [company.city, company.country !== "United Arab Emirates" ? company.country : null].filter(Boolean).join(", ");
  const primary = company.contacts.find((c) => c.isPrimary) ?? company.contacts[0];

  const linkBtn = "btn btn-outline !min-h-[42px] !px-4 text-sm";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={company.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <OptBadge list={COMPANY_STATUSES} id={company.status} />
            {[company.industry, place].filter(Boolean).length > 0 && <span>{[company.industry, place].filter(Boolean).join(" · ")}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={company.owner?.name ?? "?"} size={22} />
              {company.owner?.name ?? "Unassigned"}
            </span>
          </span>
        }
        actions={
          <>
            {company.phone && (
              <a href={telHref(company.phone)} className={linkBtn}>
                <Phone size={16} /> Call
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className={linkBtn}>
                <Mail size={16} /> Email
              </a>
            )}
            {company.website && (
              <a href={webHref(company.website)} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <Globe size={16} /> Website
              </a>
            )}
            {canDelete && (
              <form action={deleteCustomer.bind(null, company.id)}>
                <ConfirmButton
                  message={`Delete ${company.name}? Its tasks and timeline are deleted with it. Contacts, enquiries and quotes are kept but unlinked from this customer. This cannot be undone.`}
                  className="btn btn-outline !min-h-[42px] !px-4 text-sm !text-red-600 hover:!border-red-300"
                >
                  <Trash2 size={16} /> Delete
                </ConfirmButton>
              </form>
            )}
          </>
        }
      />

      {company.tags.length > 0 && (
        <ul className="-mt-3 mb-5 flex flex-wrap gap-1.5" aria-label="Tags">
          {company.tags.map((t) => (
            <li key={t}>
              <Badge tone="indigo">{t}</Badge>
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Summary" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Lifetime won"
          value={aed(wonValue, { compact: true })}
          hint={`${wonCount} won ${wonCount === 1 ? "enquiry" : "enquiries"}`}
          tone="green"
        />
        <Stat
          label="Open pipeline"
          value={aed(pipelineValue, { compact: true })}
          hint={`${openCount} open ${openCount === 1 ? "enquiry" : "enquiries"}`}
        />
        <Stat label="Quotes accepted" value={String(quotesAccepted)} hint={`of ${quoteTotal} ${quoteTotal === 1 ? "quote" : "quotes"}`} />
        <Stat
          label="Customer since"
          value={fmtDate(company.createdAt)}
          hint={lastActivity ? `Last activity ${timeAgo(lastActivity)}` : "No activity yet"}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* right column first on phones: who to call and what is due */}
        <div className="order-1 space-y-5 lg:order-2">
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <Row label="Phone">
                {company.phone ? (
                  <a href={telHref(company.phone)} className="font-semibold text-brand hover:underline">
                    {company.phone}
                  </a>
                ) : null}
              </Row>
              <Row label="Email">
                {company.email ? (
                  <a href={`mailto:${company.email}`} className="break-all font-semibold text-brand hover:underline">
                    {company.email}
                  </a>
                ) : null}
              </Row>
              <Row label="Website">
                {company.website ? (
                  <a
                    href={webHref(company.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-semibold text-brand hover:underline"
                  >
                    {prettyUrl(company.website)}
                  </a>
                ) : null}
              </Row>
              <Row label="Address">
                {company.address || company.city || company.country ? (
                  <span className="flex items-start gap-1.5">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <span>{[company.address, company.city, company.country].filter(Boolean).join(", ")}</span>
                  </span>
                ) : null}
              </Row>
              <Row label="TRN">{company.taxNumber}</Row>
              <Row label="Main contact">{primary ? `${primary.name}${primary.jobTitle ? `, ${primary.jobTitle}` : ""}` : null}</Row>
              <Row label="Owner">{company.owner?.name}</Row>
              <Row label="Notes">{company.notes ? <span className="whitespace-pre-wrap break-words">{company.notes}</span> : null}</Row>
            </dl>

            {canWrite && (
              <Disclosure
                summary={
                  <>
                    <Pencil size={15} /> Edit customer
                  </>
                }
                className="mt-5 border-t border-line pt-5"
              >
                <KeepForm action={updateCustomer.bind(null, company.id)} submitLabel="Save changes">
                  <CompanyFields users={ownerOptions} listId="industry-list-edit" defaults={company} />
                </KeepForm>
              </Disclosure>
            )}
          </Panel>

          <ContactsPanel companyId={company.id} contacts={company.contacts} canWrite={canWrite} canDelete={canDelete} />

          <TasksPanel companyId={company.id} tasks={tasks} staff={staff} defaultAssigneeId={defaultAssignee} canWrite={canWrite} />
        </div>

        <div className="order-2 space-y-5 lg:order-1 lg:col-span-2">
          <Panel
            title={`Enquiries (${leadTotal})`}
            flush
            actions={
              canWrite ? (
                <Link
                  href={`/admin/enquiries/new?companyId=${company.id}`}
                  className="inline-flex min-h-[40px] items-center gap-1 text-sm font-bold text-brand hover:underline"
                >
                  <Plus size={15} /> New enquiry
                </Link>
              ) : undefined
            }
          >
            {leads.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No enquiries linked to this customer yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/enquiries/${l.id}`} className="block px-5 py-3.5 transition hover:bg-brand-50/40">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <span className="min-w-0 break-words font-bold">{l.title ?? l.name ?? "Untitled enquiry"}</span>
                        <span className="font-display text-sm font-extrabold tabular-nums">
                          {l.valueFils != null ? aed(l.valueFils) : <span className="font-normal text-muted">No value</span>}
                        </span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <StageBadge stage={l.stage} />
                        <span>{l.owner?.name ?? "Unassigned"}</span>
                        <span>{fmtDate(l.createdAt)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {leadTotal > leads.length && (
              <p className="border-t border-line px-5 py-3 text-xs text-muted">
                Showing the latest {leads.length} of {leadTotal}.
              </p>
            )}
          </Panel>

          <Panel
            title={`Quotes (${quoteTotal})`}
            flush
            actions={
              canWrite ? (
                <Link
                  href={`/admin/quotes/new?companyId=${company.id}`}
                  className="inline-flex min-h-[40px] items-center gap-1 text-sm font-bold text-brand hover:underline"
                >
                  <Plus size={15} /> New quote
                </Link>
              ) : undefined
            }
          >
            {quotes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No quotes for this customer yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/quotes/${q.id}`} className="block px-5 py-3.5 transition hover:bg-brand-50/40">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <span className="min-w-0 break-words font-bold text-brand">
                          {q.number}
                          {q.title && <span className="ml-2 font-semibold text-text">{q.title}</span>}
                        </span>
                        <span className="font-display text-sm font-extrabold tabular-nums">{aed(q.totalFils)}</span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <OptBadge list={QUOTE_STATUSES} id={q.status} />
                        <span>{fmtDate(q.createdAt)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {quoteTotal > quotes.length && (
              <p className="border-t border-line px-5 py-3 text-xs text-muted">
                Showing the latest {quotes.length} of {quoteTotal}.
              </p>
            )}
          </Panel>

          <TimelinePanel
            companyId={company.id}
            activities={activities}
            contacts={company.contacts.map((c) => ({ id: c.id, name: c.name }))}
            canWrite={canWrite}
          />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "green" }) {
  return (
    <div className="panel min-w-0 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1.5 truncate font-display text-xl font-extrabold leading-tight ${tone === "green" ? "text-emerald-700" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd>{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}
