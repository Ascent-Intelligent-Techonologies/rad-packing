"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/components/crm/forms";

/**
 * Like ActionForm, but React does not wipe the fields when the action returns an error:
 * the submit is dispatched manually inside a transition, so people can fix a typo and resubmit.
 * Optionally resets the form and/or collapses the surrounding <details> after a successful save.
 */
export function KeepForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  className = "",
  buttonClassName = "btn btn-brand !min-h-[42px] !px-5 text-sm",
  resetOnSuccess = false,
  closeOnSuccess = false,
  extra,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
  closeOnSuccess?: boolean;
  /** extra controls rendered next to the submit button */
  extra?: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await action(prev, fd);
    if (r?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (closeOnSuccess) ref.current?.closest("details")?.removeAttribute("open");
    }
    return r;
  }, null);

  // hide the last result as soon as the person edits the form again
  const [dismissed, setDismissed] = useState<ActionState>(null);
  const shown = state && state !== dismissed ? state : null;

  return (
    <form
      ref={ref}
      className={className}
      onInput={() => setDismissed(state)}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`${buttonClassName} disabled:opacity-60`}>
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {pendingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>
        {extra}
      </div>
      {shown?.error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
          {shown.error}
        </p>
      )}
      {shown?.ok && shown.message && (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          {shown.message}
        </p>
      )}
    </form>
  );
}
