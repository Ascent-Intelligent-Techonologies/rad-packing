import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { ContactLinks, PrimaryField } from "@/components/crm/customers/ContactsPanel";
import { Disclosure } from "@/components/crm/customers/Disclosure";
import { CompanySelect, ContactFields } from "@/components/crm/customers/fields";
import { KeepForm } from "@/components/crm/customers/KeepForm";
import { ConfirmButton } from "@/components/crm/forms";
import { Avatar, Badge, OptBadge, PageHeader, Panel, StageBadge } from "@/components/crm/ui";
import { requireUser } from "@/lib/crm/auth";
import { ACTIVITY_KINDS, QUOTE_STATUSES } from "@/lib/crm/constants";
import { aed, fmtDate, fmtDateTime } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";
import { deleteContact, updateContact } from "../actions";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage(props: PageProps<"/admin/contacts/[id]">) {
  const user = await requireUser("view");
  const { id } = await props.params;
  const db = getDb()!;

  const contact = await db.contact.findUnique({ where: { id }, include: { company: { select: { id: true, name: true } } } });
  if (!contact) notFound();

  const [leads, quotes, activities, companies] = await Promise.all([
    db.lead.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { owner: { select: { name: true } } },
    }),
    db.quote.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, number: true, status: true, title: true, totalFils: true, createdAt: true },
    }),
    db.activity.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { name: true } } },
    }),
    can(user.role, "write")
      ? db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 3000 })
      : Promise.resolve([]),
  ]);

  const canWrite = can(user.role, "write");
  const canDelete = can(user.role, "delete");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/contacts", label: "Contacts" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={contact.name} size={40} />
            <span className="break-words">{contact.name}</span>
            {contact.isPrimary && (
              <Badge tone="amber">
                <Star size={11} fill="currentColor" aria-hidden="true" /> Primary
              </Badge>
            )}
          </span>
        }
        subtitle={
          <>
            {contact.jobTitle}
            {contact.jobTitle && contact.company ? " at " : ""}
            {contact.company && (
              <Link href={`/admin/customers/${contact.company.id}`} className="font-semibold text-brand hover:underline">
                {contact.company.name}
              </Link>
            )}
            {!contact.jobTitle && !contact.company && "Standalone contact"}
          </>
        }
        actions={
          canDelete ? (
            <form action={deleteContact.bind(null, contact.id, "/admin/contacts")}>
              <ConfirmButton
                message={`Delete ${contact.name}? Enquiries and quotes that mention them are kept but unlinked. This cannot be undone.`}
                className="btn btn-outline !min-h-[42px] !px-4 text-sm !text-red-600 hover:!border-red-300"
              >
                <Trash2 size={16} /> Delete
              </ConfirmButton>
            </form>
          ) : undefined
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Panel title="Details">
            <ContactLinks phone={contact.phone} email={contact.email} whatsapp={contact.whatsapp} />
            {contact.notes && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-muted">{contact.notes}</p>}
            <p className="mt-4 text-xs text-muted">Added {fmtDate(contact.createdAt)}</p>

            {canWrite && (
              <Disclosure
                summary={
                  <>
                    <Pencil size={15} /> Edit contact
                  </>
                }
                className="mt-5 border-t border-line pt-5"
                defaultOpen
              >
                <KeepForm action={updateContact.bind(null, contact.id)} submitLabel="Save changes">
                  <div className="space-y-4">
                    <ContactFields defaults={contact} withNotes />
                    <CompanySelect companies={companies} value={contact.companyId} />
                    <PrimaryField checked={contact.isPrimary} />
                  </div>
                </KeepForm>
              </Disclosure>
            )}
          </Panel>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Panel title={`Enquiries (${leads.length})`} flush>
            {leads.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No enquiries mention this contact.</p>
            ) : (
              <ul className="divide-y divide-line">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/enquiries/${l.id}`} className="block px-5 py-3.5 transition hover:bg-brand-50/40">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <span className="min-w-0 break-words font-bold">{l.title ?? l.name ?? "Untitled enquiry"}</span>
                        <span className="font-display text-sm font-extrabold tabular-nums">
                          {l.valueFils != null ? aed(l.valueFils) : ""}
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
          </Panel>

          <Panel title={`Quotes (${quotes.length})`} flush>
            {quotes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No quotes addressed to this contact.</p>
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
          </Panel>

          <Panel title="Recent activity">
            {activities.length === 0 ? (
              <p className="text-sm text-muted">Nothing logged against this contact yet.</p>
            ) : (
              <ol className="space-y-5">
                {activities.map((a) => (
                  <li key={a.id} className="relative border-l-2 border-line pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand/60" aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <OptBadge list={ACTIVITY_KINDS} id={a.kind} />
                      <span className="text-xs text-muted">
                        {a.author?.name ?? "System"} · {fmtDateTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{a.body}</p>
                  </li>
                ))}
              </ol>
            )}
            {contact.company && (
              <p className="mt-5 text-xs text-muted">
                Log notes and calls on the{" "}
                <Link href={`/admin/customers/${contact.company.id}`} className="font-semibold text-brand hover:underline">
                  customer page
                </Link>
                .
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
