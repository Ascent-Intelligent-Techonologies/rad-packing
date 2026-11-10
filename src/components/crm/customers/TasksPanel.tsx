import { CheckCircle2, Circle, Plus } from "lucide-react";
import { addTask, completeTask } from "@/app/admin/(app)/customers/[id]/actions";
import { OptBadge, Field, Panel } from "@/components/crm/ui";
import { TASK_KINDS } from "@/lib/crm/constants";
import { isPast } from "@/lib/crm/customers";
import { fmtDateTime } from "@/lib/crm/format";
import { Disclosure } from "./Disclosure";
import { KeepForm } from "./KeepForm";

export type TaskRow = {
  id: string;
  title: string;
  kind: string;
  dueAt: Date | null;
  assignee: { name: string } | null;
};

export function TasksPanel({
  companyId,
  tasks,
  staff,
  defaultAssigneeId,
  canWrite,
}: {
  companyId: string;
  tasks: TaskRow[];
  staff: { id: string; name: string }[];
  defaultAssigneeId: string | null;
  canWrite: boolean;
}) {
  return (
    <Panel title={`Open tasks (${tasks.length})`} flush>
      {tasks.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Nothing outstanding for this customer.</p>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((t) => {
            const overdue = isPast(t.dueAt);
            return (
              <li key={t.id} className="flex items-start gap-2 px-3 py-3 sm:px-4">
                {canWrite ? (
                  <form action={completeTask.bind(null, t.id)}>
                    <button
                      type="submit"
                      aria-label={`Mark "${t.title}" as done`}
                      title="Mark as done"
                      className="group grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <Circle size={20} className="group-hover:hidden" aria-hidden="true" />
                      <CheckCircle2 size={20} className="hidden group-hover:block" aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center text-muted">
                    <Circle size={20} aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1 pt-2">
                  <p className="break-words text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                    <OptBadge list={TASK_KINDS} id={t.kind} />
                    {t.dueAt ? (
                      <span className={overdue ? "font-bold text-red-600" : ""}>
                        {overdue ? "Overdue · " : "Due "}
                        {fmtDateTime(t.dueAt)}
                      </span>
                    ) : (
                      <span>No due date</span>
                    )}
                    <span>{t.assignee?.name ?? "Unassigned"}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canWrite && (
        <div className="border-t border-line px-5 py-4">
          <Disclosure
            summary={
              <>
                <Plus size={16} /> Add task
              </>
            }
          >
            <KeepForm action={addTask.bind(null, companyId)} submitLabel="Add task" pendingLabel="Adding…" resetOnSuccess closeOnSuccess>
              <div className="@container">
                <div className="grid gap-4 @md:grid-cols-2">
                  <Field label="Task *" className="@md:col-span-2">
                    <input
                      name="title"
                      required
                      maxLength={200}
                      className="field-sm"
                      placeholder="e.g. Send revised price list"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Due">
                    <input name="dueAt" type="datetime-local" className="field-sm" />
                  </Field>
                  <Field label="Type">
                    <select name="kind" defaultValue="follow_up" className="field-sm">
                      {TASK_KINDS.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Assign to" className="@md:col-span-2">
                    <select name="assigneeId" defaultValue={defaultAssigneeId ?? ""} className="field-sm">
                      {staff.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </KeepForm>
          </Disclosure>
        </div>
      )}
    </Panel>
  );
}
