import { INDUSTRIES, PRIORITIES, SOURCES, productLineOptions } from "@/lib/crm/constants";
import { fromFils, toDateInput } from "@/lib/crm/format";
import { Field } from "@/components/crm/ui";

export type EnquiryDefaults = {
  source?: string;
  priority?: string;
  title?: string | null;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  message?: string | null;
  products?: string[];
  valueFils?: number | null;
  expectedCloseDate?: Date | null;
  ownerId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
};

/** Shared inputs for creating / editing an enquiry. Renders inside an <ActionForm>. */
export function EnquiryFields({
  d = {},
  users,
  companies,
  contacts,
}: {
  d?: EnquiryDefaults;
  users: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  contacts: { id: string; name: string; companyName: string | null }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Title / summary" className="sm:col-span-2" hint="What do they need? e.g. Export crates for 3 gearboxes">
        <input name="title" defaultValue={d.title ?? ""} className="field-sm" maxLength={160} />
      </Field>
      <Field label="Contact name">
        <input name="name" defaultValue={d.name ?? ""} className="field-sm" autoComplete="off" />
      </Field>
      <Field label="Company">
        <input name="company" defaultValue={d.company ?? ""} className="field-sm" autoComplete="off" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={d.email ?? ""} className="field-sm" inputMode="email" />
      </Field>
      <Field label="Phone / WhatsApp">
        <input name="phone" type="tel" defaultValue={d.phone ?? ""} className="field-sm" inputMode="tel" />
      </Field>
      <Field label="Source">
        <select name="source" defaultValue={d.source ?? "phone"} className="field-sm">
          {SOURCES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Priority">
        <select name="priority" defaultValue={d.priority ?? "normal"} className="field-sm">
          {PRIORITIES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Estimated value (AED)">
        <input name="value" inputMode="decimal" defaultValue={fromFils(d.valueFils)} className="field-sm" placeholder="0.00" />
      </Field>
      <Field label="Expected close date">
        <input name="expectedCloseDate" type="date" defaultValue={toDateInput(d.expectedCloseDate)} className="field-sm" />
      </Field>
      <Field label="Industry">
        <input name="industry" list="industries" defaultValue={d.industry ?? ""} className="field-sm" />
        <datalist id="industries">
          {INDUSTRIES.map((i) => (
            <option key={i} value={i} />
          ))}
        </datalist>
      </Field>
      <Field label="Owner">
        <select name="ownerId" defaultValue={d.ownerId ?? ""} className="field-sm">
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </Field>

      <fieldset className="sm:col-span-2">
        <legend className="mb-1.5 text-xs font-bold">Interested in</legend>
        <div className="flex flex-wrap gap-2">
          {productLineOptions(d.products).map((p) => (
            <label key={p.id} className="cursor-pointer">
              <input type="checkbox" name="products" value={p.id} defaultChecked={d.products?.includes(p.id)} className="peer sr-only" />
              <span className="inline-flex min-h-[38px] items-center rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold transition peer-checked:border-transparent peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-amber">
                {p.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Linked customer" hint="Optional. Link to an existing customer record.">
        <select name="companyId" defaultValue={d.companyId ?? ""} className="field-sm">
          <option value="">None</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Linked contact">
        <select name="contactId" defaultValue={d.contactId ?? ""} className="field-sm">
          <option value="">None</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` · ${c.companyName}` : ""}</option>
          ))}
        </select>
      </Field>

      <Field label="Requirement / message" className="sm:col-span-2">
        <textarea name="message" defaultValue={d.message ?? ""} className="field-sm" rows={4} maxLength={4000} />
      </Field>
    </div>
  );
}
