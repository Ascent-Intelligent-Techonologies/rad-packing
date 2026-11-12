"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, Loader2, Phone } from "lucide-react";
import { industries, products, site } from "@/lib/site";
import { WhatsAppIcon } from "./Icon";

type Variant = "contact" | "quote";
type Status = "idle" | "sending" | "done" | "error";

export function LeadForm({
  variant = "contact",
  dark = false,
  defaultMessage,
  defaultInterest,
}: {
  variant?: Variant;
  /** render on a dark surface */
  dark?: boolean;
  /** pre-filled message, e.g. "I'd like a quote for: <product>" */
  defaultMessage?: string;
  /** pre-selected solution (a slug from site.ts `products`) when the URL doesn't name one */
  defaultInterest?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // product interest: starts from ?interest=slug in the URL, then follows the visitor's clicks
  const [chosen, setChosen] = useState<string[] | null>(null);
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => "",
  );
  const fromUrl = (() => {
    const q = variant === "quote" ? new URLSearchParams(search).get("interest") : null;
    if (q && products.some((p) => p.slug === q)) return [q];
    return variant === "quote" && defaultInterest && products.some((p) => p.slug === defaultInterest) ? [defaultInterest] : [];
  })();
  const picked = chosen ?? fromUrl;
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  });
  const setPicked = (v: string[]) => setChosen(v);

  // the product cards on the page can add an interest too
  useEffect(() => {
    if (variant !== "quote") return;
    const on = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      if (!pickedRef.current.includes(slug)) setChosen([...pickedRef.current, slug]);
    };
    window.addEventListener("rad:interest", on);
    return () => window.removeEventListener("rad:interest", on);
  }, [variant]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const first = String(fd.get("firstName") ?? "").trim();
    const last = String(fd.get("lastName") ?? "").trim();
    const name = variant === "quote" ? `${first} ${last}`.trim() : String(fd.get("name") ?? "").trim();

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: variant,
          name,
          company: String(fd.get("company") ?? "").trim(),
          email: String(fd.get("email") ?? "").trim(),
          phone: String(fd.get("phone") ?? "").trim(),
          industry: String(fd.get("industry") ?? "") || undefined,
          products: picked,
          message: String(fd.get("message") ?? "").trim(),
          pageUrl: window.location.pathname,
          website: String(fd.get("website") ?? ""), // honeypot
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setStatus("done");
      form.reset();
      setPicked([]);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className={`grid place-items-center rounded-[28px] p-8 text-center sm:p-12 ${
          dark ? "bg-white/5 text-white" : "bg-white text-text"
        }`}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-linear-to-br from-orange to-pink text-white shadow-lg">
          <Check size={30} strokeWidth={3} />
        </span>
        <h3 className="mt-6 font-display text-2xl font-bold">Thanks for submitting!</h3>
        <p className={`mt-2 max-w-sm ${dark ? "text-white/70" : "text-muted"}`}>
          We will get back to you shortly. Need it faster? Reach our team directly:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`tel:${site.phones[0].tel}`} className="btn btn-brand">
            <Phone size={17} /> Call us
          </a>
          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#25D366] text-[#05301a]"
          >
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </a>
        </div>
        <button type="button" onClick={() => setStatus("idle")} className="mt-6 text-sm font-semibold underline underline-offset-4 opacity-70 hover:opacity-100">
          Send another enquiry
        </button>
      </div>
    );
  }

  const labelCls = `label ${dark ? "!text-white/85" : ""}`;
  const toggle = (slug: string) => setPicked(picked.includes(slug) ? picked.filter((s) => s !== slug) : [...picked, slug]);

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-[28px] p-6 sm:p-9 ${dark ? "bg-white/[0.06] ring-1 ring-white/15 backdrop-blur" : "card"}`}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {variant === "quote" ? (
          <>
            <div>
              <label className={labelCls} htmlFor={`${variant}-fn`}>First name *</label>
              <input id={`${variant}-fn`} name="firstName" required autoComplete="given-name" className="field" placeholder="Ahmed" />
            </div>
            <div>
              <label className={labelCls} htmlFor={`${variant}-ln`}>Last name</label>
              <input id={`${variant}-ln`} name="lastName" autoComplete="family-name" className="field" placeholder="Al Mansoori" />
            </div>
          </>
        ) : (
          <div>
            <label className={labelCls} htmlFor={`${variant}-name`}>Name *</label>
            <input id={`${variant}-name`} name="name" required autoComplete="name" className="field" placeholder="Your full name" />
          </div>
        )}
        <div>
          <label className={labelCls} htmlFor={`${variant}-company`}>Company *</label>
          <input id={`${variant}-company`} name="company" required autoComplete="organization" className="field" placeholder="Company name" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${variant}-email`}>Email *</label>
          <input id={`${variant}-email`} name="email" type="email" required autoComplete="email" inputMode="email" className="field" placeholder="you@company.com" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${variant}-phone`}>Phone / WhatsApp</label>
          <input id={`${variant}-phone`} name="phone" type="tel" autoComplete="tel" inputMode="tel" className="field" placeholder="+971 ..." />
        </div>

        {variant === "quote" && (
          <>
            <div className="sm:col-span-2">
              <span className={labelCls}>Materials / solutions required</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Materials required">
                {products.map((p) => {
                  const on = picked.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(p.slug)}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                        on
                          ? "border-transparent bg-brand text-white shadow-md"
                          : dark
                            ? "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
                            : "border-line bg-white text-text hover:border-brand/40"
                      }`}
                    >
                      {on && <Check size={15} strokeWidth={3} />} {p.title}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="quote-industry">Industry</label>
              <select id="quote-industry" name="industry" className="field" defaultValue="">
                <option value="">Select your industry (optional)</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.title}>{i.title}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor={`${variant}-message`}>
            {variant === "quote" ? "What are you shipping or storing? *" : "Message *"}
          </label>
          <textarea
            id={`${variant}-message`}
            name="message"
            required
            minLength={5}
            defaultValue={defaultMessage}
            className="field"
            placeholder={
              variant === "quote"
                ? "e.g. 3 gearboxes (2 t each) for sea freight to Hamburg, 6 months of outdoor storage..."
                : "How can we help?"
            }
          />
        </div>

        {/* honeypot: real people never see or fill this */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error} You can also call us on {site.phones[0].label}.
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-accent mt-7 w-full sm:w-auto disabled:opacity-70">
        {status === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            {variant === "quote" ? "Request my quote" : "Send message"} <ArrowRight size={18} />
          </>
        )}
      </button>
      <p className={`mt-4 text-xs ${dark ? "text-white/50" : "text-muted"}`}>
        By submitting you agree to be contacted about your enquiry. See our{" "}
        <a href="/privacy-policy" className="underline underline-offset-2">Privacy Policy</a>.
      </p>
    </form>
  );
}
