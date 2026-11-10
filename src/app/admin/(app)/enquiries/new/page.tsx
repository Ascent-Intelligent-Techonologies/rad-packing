import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requirePageAccess } from "@/lib/crm/auth";
import { ActionForm, SubmitButton } from "@/components/crm/forms";
import { PageHeader, Panel } from "@/components/crm/ui";
import { createEnquiry } from "../actions";
import { EnquiryFields } from "../EnquiryFields";

export const metadata: Metadata = { title: "New enquiry" };

export default async function NewEnquiry(props: PageProps<"/admin/enquiries/new">) {
  const user = await requirePageAccess("write");
  const sp = await props.searchParams;
  const db = getDb()!;
  const companyId = typeof sp.companyId === "string" ? sp.companyId : "";
  const [users, companies, contacts, company] = await Promise.all([
    db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
    db.contact.findMany({ select: { id: true, name: true, company: { select: { name: true } } }, orderBy: { name: "asc" }, take: 500 }),
    companyId ? db.company.findUnique({ where: { id: companyId } }) : null,
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New enquiry" subtitle="Log a call, WhatsApp message or walk-in. Website and chat enquiries arrive automatically." back={{ href: "/admin/enquiries", label: "Enquiries" }} />
      <Panel>
        <ActionForm action={createEnquiry}>
          <EnquiryFields
            users={users}
            companies={companies}
            contacts={contacts.map((c) => ({ id: c.id, name: c.name, companyName: c.company?.name ?? null }))}
            d={{
              ownerId: user.id,
              companyId: company?.id,
              company: company?.name,
              industry: company?.industry,
              phone: company?.phone,
              email: company?.email,
            }}
          />
          <div className="mt-6 flex justify-end">
            <SubmitButton>Create enquiry</SubmitButton>
          </div>
        </ActionForm>
      </Panel>
    </div>
  );
}
