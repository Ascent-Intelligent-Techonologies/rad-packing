import { Database, FlaskConical, Trash2 } from "lucide-react";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { Field, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { demoStatus } from "@/lib/crm/demo-data";
import { fmtDate } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { getSettings } from "@/lib/crm/settings";
import { clearDemo, loadDemo, saveSettings } from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePageAccess("settings");
  const [s, demo] = await Promise.all([getSettings(), can(user.role, "team") ? demoStatus() : null]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company details shown on quotations, plus VAT and quote defaults."
      />

      <div className="space-y-6">
        <Panel title="Company profile & quote defaults">
          <ActionForm action={saveSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal name *">
                <input name="legalName" required maxLength={160} defaultValue={s.legalName} className="field-sm" />
              </Field>
              <Field label="TRN (tax registration number)">
                <input name="trn" maxLength={40} defaultValue={s.trn} className="field-sm" inputMode="numeric" />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea name="address" rows={2} maxLength={500} defaultValue={s.address} className="field-sm" />
              </Field>
              <Field label="Phone">
                <input name="phone" maxLength={120} defaultValue={s.phone} className="field-sm" autoComplete="off" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" maxLength={200} defaultValue={s.email} className="field-sm" autoComplete="off" />
              </Field>
              <Field label="Website" className="sm:col-span-2">
                <input name="website" maxLength={200} defaultValue={s.website} className="field-sm" />
              </Field>
            </div>

            <h3 className="mb-3 mt-7 border-t border-line pt-5 font-display text-sm font-bold">Quote defaults</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="VAT rate (%)" hint="0 to 100. Editable per quote.">
                <input name="vatRate" type="number" inputMode="decimal" min="0" max="100" step="any" required defaultValue={s.vatRate} className="field-sm" />
              </Field>
              <Field label="Quote validity (days)" hint="1 to 365.">
                <input name="quoteValidityDays" type="number" inputMode="numeric" min="1" max="365" step="1" required defaultValue={s.quoteValidityDays} className="field-sm" />
              </Field>
              <Field label="Quote number prefix" hint="Up to 12 characters, e.g. RAD-Q-">
                <input name="quotePrefix" required maxLength={12} defaultValue={s.quotePrefix} className="field-sm" />
              </Field>
              <Field label="Default terms & conditions" className="sm:col-span-3">
                <textarea name="quoteTerms" rows={5} maxLength={5000} defaultValue={s.quoteTerms} className="field-sm" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted">
              Changing the prefix only affects new quotes. Existing quotes keep their numbers.
            </p>
            <div className="mt-5">
              <SubmitButton>Save settings</SubmitButton>
            </div>
          </ActionForm>
        </Panel>

        {demo !== null && (
          <Panel title="Demo data">
            <div className="flex items-start gap-3 text-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <FlaskConical size={18} />
              </span>
              <div className="min-w-0">
                <p>
                  Fill the CRM with clearly fictional customers (named &ldquo;(demo)&rdquo;), enquiries, tasks, quotes and price-list entries
                  so you can explore dashboards and reports. Everything is tracked, so{" "}
                  <strong>Remove demo data</strong> deletes exactly what was added and nothing else.
                </p>
                {demo.loaded ? (
                  <p className="mt-2 rounded-xl bg-amber-50 px-3.5 py-2.5 font-semibold text-amber-800">
                    <Database size={14} className="mr-1.5 inline" />
                    Demo data is loaded: {demo.summary}
                    {demo.loadedAt ? ` (added ${fmtDate(demo.loadedAt)})` : ""}.
                  </p>
                ) : (
                  <p className="mt-2 text-muted">No demo data is currently loaded.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-start gap-4">
              <ActionForm action={loadDemo}>
                <SubmitButton className="btn btn-brand !min-h-[42px] !px-5 text-sm" pendingLabel="Loading demo data…">
                  <FlaskConical size={16} /> Load demo data
                </SubmitButton>
              </ActionForm>
              <ActionForm action={clearDemo}>
                <ConfirmButton
                  message="Remove all demo data? Only the records created by 'Load demo data' are deleted."
                  className="btn btn-outline !min-h-[42px] !px-5 text-sm !text-red-600 hover:!border-red-300"
                >
                  <Trash2 size={16} /> Remove demo data
                </ConfirmButton>
              </ActionForm>
            </div>
            <p className="mt-3 text-xs text-muted">
              Quote numbers used by demo quotes are released again on removal when no newer quote has been created.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
