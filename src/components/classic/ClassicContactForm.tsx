"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "sending" | "done" | "error";

/**
 * The home page's contact form, laid out like the one on RAD's original site: Name, Company,
 * Email and Message on underlined fields. It saves an enquiry the same way the other forms do.
 */
export function ClassicContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const text = (k: string) => String(fd.get(k) ?? "").trim();

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact",
          name: text("name"),
          company: text("company"),
          email: text("email"),
          message: text("message"),
          pageUrl: window.location.pathname,
          website: String(fd.get("website") ?? ""), // honeypot
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setStatus("done");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative grid gap-[25px]">
      <div>
        <label className="cl-label" htmlFor="home-name">
          Name *
        </label>
        <input id="home-name" name="name" required autoComplete="name" className="cl-input" />
      </div>
      <div>
        <label className="cl-label" htmlFor="home-company">
          Company *
        </label>
        <input id="home-company" name="company" required autoComplete="organization" className="cl-input" />
      </div>
      <div>
        <label className="cl-label" htmlFor="home-email">
          Email *
        </label>
        <input id="home-email" name="email" type="email" required autoComplete="email" inputMode="email" className="cl-input" />
      </div>
      <div>
        <label className="cl-label" htmlFor="home-message">
          Message
        </label>
        <textarea id="home-message" name="message" className="cl-input" />
      </div>

      {/* honeypot: real people never see or fill this */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" disabled={status === "sending"} className="cl-btn -mt-px !min-h-[43px] w-full !text-[16px]">
        {status === "sending" ? "Sending…" : "Submit"}
      </button>

      {status === "done" && (
        <p role="status" className="-mt-[10px] text-[16px] text-[var(--c-blue)]">
          Thanks for submitting!
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="-mt-[10px] text-[15px] text-[#b3261e]">
          {error} You can also call us on {site.phones[0].label}.
        </p>
      )}
    </form>
  );
}
