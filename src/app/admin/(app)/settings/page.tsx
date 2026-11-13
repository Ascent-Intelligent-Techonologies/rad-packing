import { ActionForm, SubmitButton } from "@/components/crm/forms";
import { Field, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { getSettings } from "@/lib/crm/settings";
import { saveSettings } from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePageAccess("settings");
  const s = await getSettings();

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

      </div>
    </>
  );
}
