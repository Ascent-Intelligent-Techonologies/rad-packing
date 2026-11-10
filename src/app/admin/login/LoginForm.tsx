"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label htmlFor="email" className="label !text-white/85">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" inputMode="email" className="field" placeholder="you@radpacking.com" />
      </div>
      <div>
        <label htmlFor="password" className="label !text-white/85">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200 ring-1 ring-red-400/30">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn btn-accent w-full disabled:opacity-70">
        {pending ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : "Sign in"}
      </button>
    </form>
  );
}
