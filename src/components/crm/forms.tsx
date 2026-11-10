"use client";

import { createContext, startTransition, useActionState, useContext, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export type ActionState = { error?: string; ok?: boolean; message?: string } | null;

/** ActionForm tells its SubmitButton when the action is running. */
const PendingContext = createContext(false);

/** Submit button that disables itself and shows a spinner while the action runs. */
export function SubmitButton({
  children,
  className = "btn btn-brand !min-h-[42px] !px-5 text-sm",
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending: formPending } = useFormStatus();
  const ctxPending = useContext(PendingContext);
  const pending = formPending || ctxPending;
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" /> {pendingLabel ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * <form> wired to a server action with the (prevState, formData) signature.
 * Shows the action's error / success message. The submit is dispatched manually inside a
 * transition so React does NOT wipe the fields when the action returns an error.
 */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await action(prev, fd);
    if (r?.ok && resetOnSuccess) ref.current?.reset();
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
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
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

/** A button inside a normal <form action={serverAction}> that asks for confirmation first. */
export function ConfirmButton({
  children,
  message = "Are you sure? This cannot be undone.",
  className = "btn btn-outline !min-h-[38px] !px-4 text-sm !text-red-600 hover:!border-red-300",
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:opacity-60`}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
