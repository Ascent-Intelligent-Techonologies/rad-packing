"use client";

import { useId, useRef, useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";

/** Unambiguous characters only (no 0/O, 1/l/I) so a spoken or typed password isn't misread. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generate(length = 14) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  // modulo bias is negligible for a 56-char alphabet over 32-bit values
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Password input with show/hide and a "Generate" helper, for admins setting temporary passwords. */
export function PasswordField({
  name = "password",
  label,
  hint = "At least 10 characters.",
  className = "",
}: {
  name?: string;
  label: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-text">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          ref={input}
          required
          minLength={10}
          maxLength={200}
          autoComplete="new-password"
          spellCheck={false}
          className="field-sm min-w-0 flex-1 basis-48"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          className="btn btn-outline !min-h-[42px] !gap-1.5 !px-3.5 text-sm"
        >
          {shown ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          {shown ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (input.current) input.current.value = generate();
            setShown(true);
          }}
          className="btn btn-outline !min-h-[42px] !gap-1.5 !px-3.5 text-sm"
        >
          <Wand2 size={15} aria-hidden="true" /> Generate
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
