import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus, Search, Star } from "lucide-react";
import { ContactLinks } from "@/components/crm/customers/ContactsPanel";
import { Disclosure } from "@/components/crm/customers/Disclosure";
import { CompanySelect, ContactFields } from "@/components/crm/customers/fields";
import { KeepForm } from "@/components/crm/customers/KeepForm";
import { Pager } from "@/components/crm/customers/Pager";
import { Avatar, Badge, EmptyState, Field, PageHeader, Panel, TableWrap } from "@/components/crm/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/crm/auth";
import { telHref, waHref } from "@/lib/crm/customers";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";
import { createContact } from "./actions";

export const metadata: Metadata = { title: "Contacts" };

const PAGE_SIZE = 25;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export default async function ContactsPage(props: PageProps<"/admin/contacts">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const db = getDb()!;

  const q = one(sp.q).trim().slice(0, 100);
  const company = one(sp.company).slice(0, 60);
  const page = Math.max(1, Math.min(10_000, parseInt(one(sp.page), 10) || 1));

  const contains = (v: string) => ({ contains: v, mode: "insensitive" as const });
  const where: Prisma.ContactWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: contains(q) },
              { jobTitle: contains(q) },
              { email: contains(q) },
              { phone: contains(q) },
              { whatsapp: contains(q) },
              { company: { is: { name: contains(q) } } },
            ],
          }
        : {},
      company === "none" ? { companyId: null } : company ? { companyId: company } : {},
    ],
  };

  const [total, contacts, companies] = await Promise.all([
    db.contact.count({ where }),
    db.contact.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 3000 }),
  ]);

  const canWrite = can(user.role, "write");
  const canExport = can(user.role, "reports");
  const filtered = Boolean(q || company);

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${total} ${total === 1 ? "person" : "people"}${filtered ? " match your filters" : ""}`}
        actions={
          canExport ? (
            // file download from a route handler, not a page: a plain anchor is correct
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/admin/export/contacts" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
              <Download size={16} /> Export CSV
            </a>
          ) : undefined
        }
      />

      {canWrite && (
        <Panel className="mb-5">
          <Disclosure
            summary={
              <>
                <Plus size={16} /> Add contact
              </>
            }
            variant="brand"
          >
            <KeepForm action={createContact} submitLabel="Add contact" pendingLabel="Adding…" resetOnSuccess closeOnSuccess>
              <div className="space-y-4">
                <ContactFields withNotes />
                <div className="@container">
                  <div className="grid gap-4 @md:grid-cols-2">
                    <CompanySelect companies={companies} />
                    <label className="flex min-h-[42px] items-center gap-2.5 self-end text-sm font-semibold">
                      <input type="checkbox" name="isPrimary" className="h-4 w-4 accent-[var(--brand)]" />
                      Make primary contact for the customer
                    </label>
                  </div>
                </div>
              </div>
            </KeepForm>
          </Disclosure>
        </Panel>
      )}

      <form
        role="search"
        className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-end"
      >
        <Field label="Search" className="sm:col-span-2 lg:col-span-1">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name, job title, email, phone, company…"
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <CompanySelect companies={companies} value={company} name="company" mode="filter" />
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="btn btn-brand !min-h-[42px] !px-5 text-sm">
            <Search size={16} /> Apply
          </button>
          {filtered && (
            <Link href="/admin/contacts" className="btn btn-outline !min-h-[42px] !px-4 text-sm">
              Clear
            </Link>
          )}
        </div>
      </form>

      <Panel flush>
        {contacts.length === 0 ? (
          <EmptyState
            title={filtered ? "No contacts match" : "No contacts yet"}
            body={
              filtered
                ? "Try a different search or clear the filters."
                : "Contacts you add here, or while creating customers, will show up in this list."
            }
          />
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className="divide-y divide-line md:hidden">
              {contacts.map((c) => (
                <li key={c.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/contacts/${c.id}`}
                        className="flex flex-wrap items-center gap-2 font-bold text-brand hover:underline"
                      >
                        <span className="break-words">{c.name}</span>
                        {c.isPrimary && (
                          <Badge tone="amber">
                            <Star size={11} fill="currentColor" aria-hidden="true" /> Primary
                          </Badge>
                        )}
                      </Link>
                      <p className="text-sm text-muted">
                        {[c.jobTitle, c.company?.name].filter(Boolean).join(" at ") || "No job title or customer"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ContactLinks phone={c.phone} email={c.email} whatsapp={c.whatsapp} />
                  </div>
                </li>
              ))}
            </ul>

            {/* tablets and up: table */}
            <div className="hidden md:block">
              <TableWrap>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job title</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => {
                    const wa = waHref(c.whatsapp);
                    return (
                      <tr key={c.id}>
                        <td className="max-w-[240px]">
                          <Link
                            href={`/admin/contacts/${c.id}`}
                            className="inline-flex max-w-full items-center gap-2 font-bold text-brand hover:underline"
                          >
                            <span className="truncate">{c.name}</span>
                            {c.isPrimary && (
                              <Badge tone="amber">
                                <Star size={11} fill="currentColor" aria-hidden="true" /> Primary
                              </Badge>
                            )}
                          </Link>
                        </td>
                        <td className="text-muted">{c.jobTitle ?? "—"}</td>
                        <td className="max-w-[220px]">
                          {c.company ? (
                            <Link
                              href={`/admin/customers/${c.company.id}`}
                              className="block truncate font-semibold hover:text-brand hover:underline"
                            >
                              {c.company.name}
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="max-w-[240px]">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="block truncate hover:text-brand hover:underline">
                              {c.email}
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {c.phone ? (
                            <a href={telHref(c.phone)} className="hover:text-brand hover:underline">
                              {c.phone}
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {wa ? (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                              {c.whatsapp}
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </div>
            <Pager basePath="/admin/contacts" params={{ q, company }} page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </Panel>
    </>
  );
}
