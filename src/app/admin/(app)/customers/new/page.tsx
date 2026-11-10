import type { Metadata } from "next";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { ContactFields, CompanyFields } from "@/components/crm/customers/fields";
import { KeepForm } from "@/components/crm/customers/KeepForm";
import { PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { findDuplicateCompany, staffOptions } from "@/lib/crm/customers-data";
import { getDb } from "@/lib/db";
import { createCustomer } from "../actions";

export const metadata: Metadata = { title: "New customer" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export default async function NewCustomerPage(props: PageProps<"/admin/customers/new">) {
  const user = await requirePageAccess("write");
  const sp = await props.searchParams;
  const db = getDb()!;

  const fromLeadId = one(sp.fromLead).slice(0, 60);
  const [users, lead] = await Promise.all([
    staffOptions(),
    fromLeadId
      ? db.lead.findUnique({ where: { id: fromLeadId }, include: { account: { select: { id: true, name: true } } } })
      : Promise.resolve(null),
  ]);

  // the enquiry's company name may already exist as a customer
  const existing = lead?.company ? await findDuplicateCompany(db, lead.company.trim()) : null;

  const ownerId = lead?.ownerId && users.some((u) => u.id === lead.ownerId) ? lead.ownerId : user.id;

  return (
    <>
      <PageHeader
        title="New customer"
        subtitle="Add a company and, optionally, its main contact."
        back={{ href: "/admin/customers", label: "Customers" }}
      />

      {lead && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-50 px-4 py-3 text-sm">
          <Link2 size={18} className="mt-0.5 shrink-0 text-brand" />
          <p>
            Creating from enquiry{" "}
            <Link href={`/admin/enquiries/${lead.id}`} className="font-bold text-brand hover:underline">
              {lead.title ?? lead.name ?? lead.company ?? "Untitled enquiry"}
            </Link>
            . It will be linked to this customer once saved.
            {lead.account && (
              <>
                {" "}
                <span className="font-semibold text-amber-800">
                  It is currently linked to{" "}
                  <Link href={`/admin/customers/${lead.account.id}`} className="underline">
                    {lead.account.name}
                  </Link>
                  ; that link will be replaced.
                </span>
              </>
            )}
            {existing && existing.id !== lead.account?.id && (
              <span className="mt-1 block font-semibold text-amber-800">
                A customer called{" "}
                <Link href={`/admin/customers/${existing.id}`} className="underline">
                  {existing.name}
                </Link>{" "}
                already exists. Open it instead of creating a duplicate.
              </span>
            )}
          </p>
        </div>
      )}

      <KeepForm
        action={createCustomer}
        submitLabel="Create customer"
        pendingLabel="Creating…"
        extra={
          <Link href="/admin/customers" className="btn btn-outline !min-h-[42px] !px-5 text-sm">
            Cancel
          </Link>
        }
      >
        {lead && <input type="hidden" name="fromLead" value={lead.id} />}
        <div className="space-y-5">
          <Panel title="Company">
            <CompanyFields users={users} defaults={{ name: lead?.company, industry: lead?.industry, ownerId, status: "prospect" }} />
          </Panel>
          <Panel title="Primary contact (optional)">
            <p className="-mt-1 mb-4 text-sm text-muted">Leave the name empty to add contacts later.</p>
            <ContactFields prefix="contact" nameRequired={false} defaults={{ name: lead?.name, email: lead?.email, phone: lead?.phone }} />
          </Panel>
        </div>
      </KeepForm>
    </>
  );
}
