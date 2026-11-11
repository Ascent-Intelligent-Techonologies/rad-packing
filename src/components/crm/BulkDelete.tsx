"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

/** Checkboxes join the bulk form through their `form` attribute, so lists stay server-rendered. */
const boxes = (formId: string) => `input[type="checkbox"][name="ids"][form="${formId}"]`;

/** Header checkbox that ticks / unticks every row checkbox belonging to `formId`. */
export function SelectAll({ formId, label = "Select all rows" }: { formId: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const reset = () => {
      if (ref.current) ref.current.checked = false;
    };
    document.addEventListener("bulk-reset", reset);
    return () => document.removeEventListener("bulk-reset", reset);
  }, []);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
      onChange={(e) => {
        const on = e.currentTarget.checked;
        document.querySelectorAll<HTMLInputElement>(boxes(formId)).forEach((c) => (c.checked = on));
        document.dispatchEvent(new Event("bulk-change"));
      }}
    />
  );
}

/** A row checkbox. Give every row one with the same formId. */
export function RowCheck({ formId, id, label }: { formId: string; id: string; label: string }) {
  return (
    <input
      type="checkbox"
      name="ids"
      value={id}
      form={formId}
      aria-label={label}
      className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--brand)]"
    />
  );
}

/**
 * The "N selected · Delete selected" bar. Renders the (empty) form the row checkboxes
 * belong to, asks for confirmation, then runs the server action.
 */
export function BulkDelete({
  formId,
  action,
  noun,
  nounPlural,
  warning = "This cannot be undone.",
}: {
  formId: string;
  action: (formData: FormData) => Promise<void>;
  noun: string;
  nounPlural: string;
  warning?: string;
}) {
  const [count, setCount] = useState(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    const recount = () =>
      setCount(new Set([...document.querySelectorAll<HTMLInputElement>(`${boxes(formId)}:checked`)].map((c) => c.value)).size);
    document.addEventListener("change", recount);
    document.addEventListener("bulk-change", recount);
    return () => {
      document.removeEventListener("change", recount);
      document.removeEventListener("bulk-change", recount);
    };
  }, [formId]);

  return (
    <form
      id={formId}
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!count || pending) return;
        if (!window.confirm(`Delete ${count} ${count === 1 ? noun : nounPlural}? ${warning}`)) return;
        const fd = new FormData(e.currentTarget);
        start(async () => {
          await action(fd);
          document.querySelectorAll<HTMLInputElement>(boxes(formId)).forEach((c) => (c.checked = false));
          document.dispatchEvent(new Event("bulk-change"));
          document.dispatchEvent(new Event("bulk-reset"));
        });
      }}
    >
      <span className="text-sm text-muted" aria-live="polite">
        {count ? `${count} selected` : `Tick ${nounPlural} to delete them`}
      </span>
      <button
        type="submit"
        disabled={!count || pending}
        className="btn btn-outline !min-h-[38px] !px-4 text-sm !text-red-600 hover:!border-red-300 disabled:opacity-40"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete selected
      </button>
    </form>
  );
}
