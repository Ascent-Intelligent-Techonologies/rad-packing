import { Mail, MessageCircle, Phone, Plus, Star, Trash2 } from "lucide-react";
import { createContact, deleteContact, setPrimaryContact, updateContact } from "@/app/admin/(app)/contacts/actions";
import { ConfirmButton } from "@/components/crm/forms";
import { Avatar, Badge, Panel } from "@/components/crm/ui";
import type { Contact } from "@/generated/prisma/client";
import { telHref, waHref } from "@/lib/crm/customers";
import { ContactFields } from "./fields";
import { Disclosure } from "./Disclosure";
import { KeepForm } from "./KeepForm";

const chip =
  "inline-flex min-h-[40px] max-w-full items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-semibold transition hover:border-brand hover:text-brand";

/** tel: / mailto: / WhatsApp quick links for a contact (or a company when only phone/email are given). */
export function ContactLinks({ phone, email, whatsapp }: { phone?: string | null; email?: string | null; whatsapp?: string | null }) {
  const wa = waHref(whatsapp);
  if (!phone && !email && !wa) return <span className="text-sm text-muted">No phone or email</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <a href={telHref(phone)} className={chip}>
          <Phone size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{phone}</span>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={chip}>
          <Mail size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{email}</span>
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={chip}>
          <MessageCircle size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="truncate">WhatsApp</span>
        </a>
      )}
    </div>
  );
}

export function PrimaryField({ checked }: { checked: boolean }) {
  return (
    <label className="flex min-h-[40px] items-center gap-2.5 text-sm font-semibold">
      <input type="hidden" name="primaryField" value="1" />
      <input type="checkbox" name="isPrimary" defaultChecked={checked} className="h-4 w-4 accent-[var(--brand)]" />
      Primary contact for this customer
    </label>
  );
}

export function ContactsPanel({
  companyId,
  contacts,
  canWrite,
  canDelete,
}: {
  companyId: string;
  contacts: Contact[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  return (
    <Panel title={`Contacts (${contacts.length})`} flush>
      {contacts.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No contacts yet. Add the people you deal with at this company.</p>
      ) : (
        <ul className="divide-y divide-line">
          {contacts.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="break-words">{c.name}</span>
                    {c.isPrimary && (
                      <Badge tone="amber">
                        <Star size={11} fill="currentColor" aria-hidden="true" /> Primary
                      </Badge>
                    )}
                  </p>
                  {c.jobTitle && <p className="text-sm text-muted">{c.jobTitle}</p>}
                </div>
                {canWrite && !c.isPrimary && (
                  <form action={setPrimaryContact.bind(null, c.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-bold text-muted transition hover:bg-amber-50 hover:text-amber-800"
                    >
                      <Star size={13} aria-hidden="true" /> Make primary
                    </button>
                  </form>
                )}
              </div>
              <div className="mt-3">
                <ContactLinks phone={c.phone} email={c.email} whatsapp={c.whatsapp} />
              </div>
              {c.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{c.notes}</p>}

              {canWrite && (
                <Disclosure summary="Edit" variant="link" className="mt-1">
                  <KeepForm action={updateContact.bind(null, c.id)} submitLabel="Save contact">
                    <ContactFields defaults={c} withNotes />
                    <div className="mt-3">
                      <PrimaryField checked={c.isPrimary} />
                    </div>
                  </KeepForm>
                  {canDelete && (
                    <form action={deleteContact.bind(null, c.id, null)} className="mt-4 border-t border-line pt-4">
                      <ConfirmButton message={`Delete ${c.name}? Enquiries and quotes that mention them are kept but unlinked.`}>
                        <Trash2 size={15} /> Delete contact
                      </ConfirmButton>
                    </form>
                  )}
                </Disclosure>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="border-t border-line px-5 py-4">
          <Disclosure
            summary={
              <>
                <Plus size={16} /> Add contact
              </>
            }
          >
            <KeepForm action={createContact} submitLabel="Add contact" pendingLabel="Adding…" resetOnSuccess closeOnSuccess>
              <input type="hidden" name="companyId" value={companyId} />
              <ContactFields withNotes />
              <div className="mt-3">
                <label className="flex min-h-[40px] items-center gap-2.5 text-sm font-semibold">
                  <input type="checkbox" name="isPrimary" className="h-4 w-4 accent-[var(--brand)]" />
                  Make primary contact
                </label>
              </div>
            </KeepForm>
          </Disclosure>
        </div>
      )}
    </Panel>
  );
}
