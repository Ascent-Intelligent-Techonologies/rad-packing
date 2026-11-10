import { PRIORITIES, TASK_KINDS } from "@/lib/crm/constants";
import { Field } from "@/components/crm/ui";

export type TaskDefaults = {
  id?: string;
  title?: string;
  notes?: string | null;
  kind?: string;
  priority?: string;
  /** value for <input type="datetime-local"> */
  dueAt?: string;
  assigneeId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
};

/** Inputs shared by the "New task" and "Edit task" forms. Rendered inside an <ActionForm>. */
export function TaskFields({
  defaults = {},
  users,
  companies,
}: {
  defaults?: TaskDefaults;
  users: { id: string; name: string; active: boolean }[];
  companies: { id: string; name: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {defaults.leadId && !defaults.id && <input type="hidden" name="leadId" value={defaults.leadId} />}

      <Field label="Title *" className="sm:col-span-2">
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={defaults.title ?? ""}
          placeholder="e.g. Call back about export crates"
          className="field-sm"
        />
      </Field>

      <Field label="Type">
        <select name="kind" defaultValue={defaults.kind ?? "follow_up"} className="field-sm">
          {TASK_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Priority">
        <select name="priority" defaultValue={defaults.priority ?? "normal"} className="field-sm">
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Due (Dubai time)">
        <input type="datetime-local" name="dueAt" defaultValue={defaults.dueAt ?? ""} className="field-sm" />
      </Field>

      <Field label="Assigned to">
        <select name="assigneeId" defaultValue={defaults.assigneeId ?? ""} className="field-sm">
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.active ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Link to customer" className="sm:col-span-2">
        <select name="companyId" defaultValue={defaults.companyId ?? ""} className="field-sm">
          <option value="">No customer</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes" className="sm:col-span-2">
        <textarea name="notes" rows={3} maxLength={4000} defaultValue={defaults.notes ?? ""} className="field-sm" />
      </Field>
    </div>
  );
}
