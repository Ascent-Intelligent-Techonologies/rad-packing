"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Loader2, Minus, Phone, Sparkles } from "lucide-react";
import { GREETING, type ChatLink, type ChatReply } from "@/lib/chat/types";
import { site } from "@/lib/site";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  links?: ChatLink[];
  suggestions?: string[];
  /** inline lead form card attached to this assistant message */
  leadForm?: "open" | "done";
};

const STORE = "rad-chat-v1";
const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);

const fromReply = (r: ChatReply): Msg => ({
  id: uid(),
  role: "assistant",
  content: r.message,
  time: now(),
  links: r.links,
  suggestions: r.suggestions,
  leadForm: r.showLeadForm ? "open" : undefined,
});

/** **bold** → <strong>, everything else stays plain text (never raw HTML). */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const msgsRef = useRef<Msg[]>([]);
  msgsRef.current = msgs;

  // restore the conversation for this tab
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE);
      if (raw) {
        const s = JSON.parse(raw);
        setSessionId(s.id);
        setMsgs(s.msgs);
        setOpen(Boolean(s.open));
      } else {
        setSessionId(uid());
        setMsgs([fromReply(GREETING)]);
      }
    } catch {
      setSessionId(uid());
      setMsgs([fromReply(GREETING)]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ id: sessionId, msgs, open }));
    } catch {}
  }, [hydrated, sessionId, msgs, open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  // lock page scroll behind the full-screen mobile sheet
  useEffect(() => {
    if (!open) return;
    const small = window.matchMedia("(max-width: 639px)").matches;
    if (small) document.body.style.overflow = "hidden";
    else inputRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setInput("");

      const userMsg: Msg = { id: uid(), role: "user", content: q, time: now() };
      // once the visitor replies, earlier quick-reply buttons are retired
      const next = [...msgsRef.current.map((m) => ({ ...m, suggestions: undefined })), userMsg];
      setMsgs(next);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messages: next.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Request failed");
        setMsgs((cur) => [...cur, fromReply(data as ChatReply)]);
      } catch (e) {
        setMsgs((cur) => [
          ...cur,
          {
            id: uid(),
            role: "assistant",
            time: now(),
            content:
              e instanceof Error && e.message.includes("quickly")
                ? e.message
                : `Sorry, I couldn't reach the assistant just now. Please call **${site.phones[0].label}** and our team will help right away.`,
            suggestions: ["I want to contact you"],
          },
        ]);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [sessionId],
  );

  // "Ask AI" buttons elsewhere on the site
  useEffect(() => {
    const on = (e: Event) => {
      setOpen(true);
      const prompt = (e as CustomEvent<string | undefined>).detail;
      if (prompt) setTimeout(() => send(prompt), 250);
    };
    window.addEventListener("rad:chat-open", on);
    return () => window.removeEventListener("rad:chat-open", on);
  }, [send]);

  async function submitLead(msgId: string, form: HTMLFormElement) {
    const fd = new FormData(form);
    const transcript = msgsRef.current
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-30);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "chat",
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        message: String(fd.get("message") ?? ""),
        transcript,
        pageUrl: window.location.pathname,
        website: String(fd.get("website") ?? ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Could not send. Please try again.");
    setMsgs((cur) => [
      ...cur.map((m) => (m.id === msgId ? { ...m, leadForm: "done" as const } : m)),
      {
        id: uid(),
        role: "assistant",
        time: now(),
        content:
          "Thank you! ✅ Your details are with our team and they'll get back to you as soon as we can. Is there anything else I can help with?",
        suggestions: ["What products do you offer?", "Tell me about onsite packing"],
      },
    ]);
  }

  const lastAssistantId = [...msgs].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat with AI"
        aria-expanded={open}
        className={`fixed bottom-[92px] right-4 z-50 items-center gap-2.5 rounded-full bg-brand px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_40px_-8px_rgba(32,38,224,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 active:scale-95 sm:right-6 lg:bottom-6 ${
          open ? "pointer-events-none hidden translate-y-4 opacity-0 sm:flex" : "flex"
        }`}
        style={{ animation: open ? undefined : "pulse-ring 2.4s ease-out infinite" }}
      >
        <Sparkles size={19} className="text-amber" />
        Chat with AI
      </button>

      {/* Panel */}
      <section
        role="dialog"
        aria-label="RAD Smart Chat"
        aria-modal="false"
        aria-hidden={!open}
        className={`fixed z-[60] flex flex-col overflow-hidden bg-white shadow-[0_40px_100px_-20px_rgba(5,7,31,0.55)] transition-all duration-300 ease-out inset-0 h-dvh sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100dvh-48px)] sm:w-[400px] sm:rounded-[28px] sm:border sm:border-line ${
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-6 opacity-0"
        }`}
      >
        <header className="relative flex items-center gap-3 overflow-hidden bg-ink px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white">
          <div className="stripe-mark !opacity-40" />
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-orange to-pink">
            <Sparkles size={19} />
          </span>
          <div className="relative flex-1 leading-tight">
            <p className="font-display text-base font-bold">RAD Smart Chat</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#3ddc84]" /> Smart assistant · replies instantly
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimize chat"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <Minus size={20} />
          </button>
        </header>

        <div ref={scroller} className="chat-scroll flex-1 space-y-5 overflow-y-auto bg-surface px-4 py-5" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={`chat-msg flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                  <Sparkles size={14} />
                </span>
              )}
              <div className={`max-w-[84%] ${m.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-left text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-lg bg-brand text-white"
                      : "rounded-bl-lg border border-line bg-white text-text"
                  }`}
                >
                  <Rich text={m.content} />
                </div>

                {m.links && m.links.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => window.matchMedia("(max-width: 639px)").matches && setOpen(false)}
                        className="rounded-full border border-brand/35 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}

                {m.leadForm && (
                  <LeadCard
                    state={m.leadForm}
                    onSubmit={(form) => submitLead(m.id, form)}
                  />
                )}

                {m.id === lastAssistantId && m.suggestions && m.suggestions.length > 0 && !busy && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] font-medium text-text transition hover:border-brand hover:text-brand"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1.5 text-[11px] text-muted/80">{m.time}</p>
              </div>
            </div>
          ))}

          {busy && (
            <div className="chat-msg flex items-center gap-2.5" aria-label="Assistant is typing">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                <Sparkles size={14} />
              </span>
              <div className="flex gap-1.5 rounded-3xl rounded-bl-lg border border-line bg-white px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-brand"
                    style={{ animation: `dot-bounce 1.1s ${i * 0.15}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-surface py-1.5 pl-5 pr-1.5 transition focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(32,38,224,0.12)]"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Type your message…"
              aria-label="Type your message"
              enterKeyHint="send"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-text placeholder:text-[#9498b8] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition enabled:hover:bg-brand-600 disabled:opacity-40"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </form>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
            Automated assistant. Urgent?
            <a href={`tel:${site.phones[0].tel}`} className="inline-flex items-center gap-1 font-bold text-brand">
              <Phone size={11} /> {site.phones[0].label}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

/** The inline lead capture card the assistant opens (Full Name, Email*, Phone, Message). */
function LeadCard({
  state,
  onSubmit,
}: {
  state: "open" | "done";
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}) {
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  if (state === "done") {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#e7f9ee] px-4 py-3 text-sm font-semibold text-[#128c4a]">
        <Check size={17} strokeWidth={3} /> Details sent to our team
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-text placeholder:text-[#9498b8] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
  return (
    <form
      className="mt-3 grid gap-3 rounded-3xl border border-line bg-white p-4 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setErr("");
        try {
          await onSubmit(e.currentTarget);
        } catch (er) {
          setErr(er instanceof Error ? er.message : "Could not send.");
          setSending(false);
        }
      }}
    >
      <p className="text-[13px] leading-snug text-muted">
        Leave your details and we&apos;ll get back to you as soon as we can.
      </p>
      <label className="grid gap-1 text-xs font-bold text-text">
        Full Name
        <input name="name" autoComplete="name" className={input} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-text">
        Email *
        <input name="email" type="email" required autoComplete="email" inputMode="email" className={input} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-text">
        Phone Number
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" className={input} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-text">
        Message
        <textarea name="message" rows={3} className={`${input} resize-none`} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {err && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="btn btn-brand !min-h-[46px] w-full disabled:opacity-70"
      >
        {sending ? <Loader2 size={17} className="animate-spin" /> : "Submit"}
      </button>
    </form>
  );
}
