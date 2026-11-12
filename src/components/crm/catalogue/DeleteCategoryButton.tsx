"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmButton, type ActionState } from "@/components/crm/forms";

/**
 * Delete button for a category. The server refuses while the category still holds
 * sub-categories or products; that message appears right below the button.
 */
export function DeleteCategoryButton({
  id,
  name,
  action,
  className,
  label = "Delete",
}: {
  id: string;
  name: string;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  className: string;
  /** visible text; omit for an icon-only button (the name is still announced) */
  label?: string | null;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message={`Delete the category "${name}"? This cannot be undone.`} className={className}>
          <Trash2 size={16} aria-hidden="true" />
          {label ? label : <span className="sr-only">Delete {name}</span>}
        </ConfirmButton>
      </form>
      {state?.error && (
        <p role="alert" className="basis-full rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
    </>
  );
}
