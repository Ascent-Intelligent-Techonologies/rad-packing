import { addNote } from "@/app/admin/(app)/customers/[id]/actions";
import { Field, OptBadge, Panel } from "@/components/crm/ui";
import { ACTIVITY_KINDS, MANUAL_ACTIVITY_KINDS } from "@/lib/crm/constants";
import { fmtDateTime } from "@/lib/crm/format";
import { KeepForm } from "./KeepForm";

export type ActivityRow = {
  id: string;
  kind: string;
  body: string;
  createdAt: Date;
  author: { name: string } | null;
  contact: { name: string } | null;
};

export function TimelinePanel({
  companyId,
  activities,
  contacts,
  canWrite,
}: {
  companyId: string;
  activities: ActivityRow[];
  contacts: { id: string; name: string }[];
  canWrite: boolean;
}) {
  return (
    <Panel title="Activity timeline">
      {canWrite && (
        <KeepForm
          action={addNote.bind(null, companyId)}
          submitLabel="Add to timeline"
          pendingLabel="Adding…"
          resetOnSuccess
          className="mb-6 rounded-2xl bg-surface p-4"
        >
          <div className="@container">
            <div className="grid gap-4 @md:grid-cols-2">
              <Field label="Note or activity" className="@md:col-span-2">
                <textarea
                  name="body"
                  required
                  rows={3}
                  maxLength={5000}
                  className="field-sm"
                  placeholder="What happened? e.g. Called Ahmed, wants a revised quote by Thursday."
                />
              </Field>
              <Field label="Type">
                <select name="kind" defaultValue="note" className="field-sm">
                  {MANUAL_ACTIVITY_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </Field>
              {contacts.length > 0 && (
                <Field label="About contact (optional)">
                  <select name="contactId" defaultValue="" className="field-sm">
                    <option value="">Whole company</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </div>
        </KeepForm>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-muted">No activity logged yet.</p>
      ) : (
        <ol className="space-y-5">
          {activities.map((a) => {
            const system = a.kind === "system" || a.kind === "stage_change";
            return (
              <li key={a.id} className="relative border-l-2 border-line pl-4">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand/60" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <OptBadge list={ACTIVITY_KINDS} id={a.kind} />
                  <span className="text-xs text-muted">
                    {a.author?.name ?? "System"} · <time dateTime={a.createdAt.toISOString()}>{fmtDateTime(a.createdAt)}</time>
                    {a.contact ? ` · re ${a.contact.name}` : ""}
                  </span>
                </div>
                <p className={`mt-1.5 whitespace-pre-wrap break-words text-sm ${system ? "text-muted" : ""}`}>{a.body}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
