import { Field } from "@/components/crm/ui";
import { COMPANY_STATUSES, INDUSTRIES } from "@/lib/crm/constants";
import { contactKey } from "@/lib/crm/customers";

export type UserOption = { id: string; name: string; active?: boolean };

export type CompanyDefaults = {
  name?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxNumber?: string | null;
  status?: string | null;
  ownerId?: string | null;
  tags?: string[];
  notes?: string | null;
};

const v = (s: string | null | undefined) => s ?? "";

/** Owner <select>. Pass `all` to render an "all owners" + "unassigned" filter variant. */
export function OwnerSelect({
  users,
  value,
  name = "ownerId",
  label = "Owner",
  mode = "assign",
}: {
  users: UserOption[];
  value?: string | null;
  name?: string;
  label?: string;
  mode?: "assign" | "filter";
}) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={value ?? ""} className="field-sm">
        {mode === "filter" ? (
          <>
            <option value="">All owners</option>
            <option value="unassigned">Unassigned</option>
          </>
        ) : (
          <option value="">Unassigned</option>
        )}
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
            {u.active === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** All company inputs (no <form> wrapper). `listId` must be unique on the page. */
export function CompanyFields({
  defaults = {},
  users,
  listId = "industry-list",
}: {
  defaults?: CompanyDefaults;
  users: UserOption[];
  listId?: string;
}) {
  return (
    <div className="@container">
      <div className="grid gap-4 @md:grid-cols-2">
        <Field label="Company name *" className="@md:col-span-2">
          <input name="name" required maxLength={160} defaultValue={v(defaults.name)} className="field-sm" autoComplete="organization" />
        </Field>
        <Field label="Industry">
          <input
            name="industry"
            list={listId}
            maxLength={120}
            defaultValue={v(defaults.industry)}
            className="field-sm"
            placeholder="Start typing or pick one"
          />
          <datalist id={listId}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={defaults.status ?? "prospect"} className="field-sm">
            {COMPANY_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={40}
            defaultValue={v(defaults.phone)}
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <Field label="Email">
          <input name="email" type="email" maxLength={200} defaultValue={v(defaults.email)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Website">
          <input
            name="website"
            inputMode="url"
            maxLength={200}
            defaultValue={v(defaults.website)}
            className="field-sm"
            placeholder="www.example.ae"
            autoComplete="off"
          />
        </Field>
        <Field label="TRN / tax number">
          <input name="taxNumber" maxLength={60} defaultValue={v(defaults.taxNumber)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Address" className="@md:col-span-2">
          <input name="address" maxLength={300} defaultValue={v(defaults.address)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="City">
          <input name="city" maxLength={100} defaultValue={v(defaults.city)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Country">
          <input
            name="country"
            maxLength={100}
            defaultValue={defaults.country ?? "United Arab Emirates"}
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <OwnerSelect users={users} value={defaults.ownerId} />
        <Field label="Tags" hint="Comma separated, e.g. export, oem, key account">
          <input name="tags" defaultValue={(defaults.tags ?? []).join(", ")} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Notes" className="@md:col-span-2">
          <textarea name="notes" rows={3} maxLength={5000} defaultValue={v(defaults.notes)} className="field-sm" />
        </Field>
      </div>
    </div>
  );
}

export type ContactDefaults = {
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
};

/**
 * Contact inputs (no <form> wrapper). With `prefix="contact"` the names become
 * contactName / contactJobTitle / … so the block can sit inside the company form.
 */
export function ContactFields({
  defaults = {},
  prefix = "",
  nameRequired = true,
  withNotes = false,
}: {
  defaults?: ContactDefaults;
  prefix?: string;
  nameRequired?: boolean;
  withNotes?: boolean;
}) {
  const k = (s: string) => contactKey(prefix, s);
  return (
    <div className="@container">
      <div className="grid gap-4 @md:grid-cols-2">
        <Field label={nameRequired ? "Name *" : "Name"}>
          <input
            name={k("name")}
            required={nameRequired}
            maxLength={120}
            defaultValue={v(defaults.name)}
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <Field label="Job title">
          <input name={k("jobTitle")} maxLength={120} defaultValue={v(defaults.jobTitle)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Email">
          <input name={k("email")} type="email" maxLength={200} defaultValue={v(defaults.email)} className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Phone">
          <input
            name={k("phone")}
            type="tel"
            inputMode="tel"
            maxLength={40}
            defaultValue={v(defaults.phone)}
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        <Field label="WhatsApp" hint="With country code, e.g. +971 50 123 4567">
          <input
            name={k("whatsapp")}
            type="tel"
            inputMode="tel"
            maxLength={40}
            defaultValue={v(defaults.whatsapp)}
            className="field-sm"
            autoComplete="off"
          />
        </Field>
        {withNotes && (
          <Field label="Notes" className="@md:col-span-2">
            <textarea name={k("notes")} rows={2} maxLength={2000} defaultValue={v(defaults.notes)} className="field-sm" />
          </Field>
        )}
      </div>
    </div>
  );
}

/** Customer <select> for contact forms. `mode="filter"` adds "All" and "No customer" choices. */
export function CompanySelect({
  companies,
  value,
  name = "companyId",
  label = "Customer",
  mode = "assign",
}: {
  companies: { id: string; name: string }[];
  value?: string | null;
  name?: string;
  label?: string;
  mode?: "assign" | "filter";
}) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={value ?? ""} className="field-sm">
        {mode === "filter" ? (
          <>
            <option value="">All customers</option>
            <option value="none">No customer</option>
          </>
        ) : (
          <option value="">No customer</option>
        )}
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
