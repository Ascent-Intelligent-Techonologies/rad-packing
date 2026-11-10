"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Clock, Flame, GripVertical } from "lucide-react";
import { LOST_REASONS, STAGES, toneClass, opt, SOURCES } from "@/lib/crm/constants";
import { aed } from "@/lib/crm/format";
import { Avatar, ScoreChip } from "@/components/crm/ui";
import { moveStage } from "./actions";

export type BoardCard = {
  id: string;
  title: string;
  sub: string;
  stage: string;
  valueFils: number | null;
  score: number;
  priority: string;
  source: string;
  owner: string | null;
  ageDays: number;
  overdueTask: boolean;
};

const dot: Record<string, string> = {
  blue: "bg-blue-500", indigo: "bg-indigo-500", violet: "bg-violet-500", amber: "bg-amber-500",
  orange: "bg-orange-500", green: "bg-emerald-500", red: "bg-red-500", slate: "bg-slate-400", pink: "bg-pink-500",
};

export function Board({ cards, canWrite }: { cards: BoardCard[]; canWrite: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(cards, (cur, m: { id: string; stage: string }) =>
    cur.map((c) => (c.id === m.id ? { ...c, stage: m.stage } : c)),
  );
  const [, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lost, setLost] = useState<{ id: string } | null>(null);

  function move(id: string, stage: string, reason?: string) {
    const card = optimistic.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    if (stage === "lost" && !reason) {
      setLost({ id });
      return;
    }
    setError("");
    start(async () => {
      setOptimistic({ id, stage });
      const r = await moveStage(id, stage, reason);
      if (!r.ok) setError(r.error ?? "Could not move enquiry.");
    });
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:px-0">
        {STAGES.map((s) => {
          const col = optimistic.filter((c) => c.stage === s.id);
          const total = col.reduce((n, c) => n + (c.valueFils ?? 0), 0);
          const shown = s.open ? col : col.slice(0, 25);
          return (
            <section
              key={s.id}
              aria-label={`${s.label} column`}
              onDragOver={(e) => {
                if (!canWrite || !dragId) return;
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId) move(dragId, s.id);
                setDragId(null);
              }}
              className={`flex w-[84vw] max-w-[320px] shrink-0 snap-center flex-col rounded-3xl border p-3 transition lg:w-[290px] ${
                over === s.id ? "border-brand bg-brand-50/60" : "border-line bg-white/60"
              }`}
            >
              <header className="flex items-center justify-between px-2 pb-3 pt-1">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot[s.tone]}`} /> {s.label}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">{col.length}</span>
                </h3>
                {total > 0 && <span className="text-xs font-semibold text-muted">{aed(total, { compact: true })}</span>}
              </header>

              <ul className="flex min-h-[80px] flex-1 flex-col gap-2.5">
                {shown.map((c) => (
                  <li
                    key={c.id}
                    draggable={canWrite}
                    onDragStart={(e) => {
                      setDragId(c.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", c.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOver(null);
                    }}
                    className={`group rounded-2xl border border-line bg-white p-3.5 shadow-sm transition hover:border-brand/40 hover:shadow-md ${
                      dragId === c.id ? "opacity-40" : ""
                    } ${canWrite ? "lg:cursor-grab" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {canWrite && <GripVertical size={14} className="mt-0.5 hidden shrink-0 text-muted/40 lg:block" />}
                      <Link href={`/admin/enquiries/${c.id}`} className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[14.5px] font-bold leading-snug">{c.title}</p>
                        {c.sub && <p className="mt-0.5 truncate text-xs text-muted">{c.sub}</p>}
                      </Link>
                      <ScoreChip score={c.score} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className={`badge ${toneClass[opt(SOURCES, c.source)?.tone ?? "slate"]}`}>{opt(SOURCES, c.source)?.label ?? c.source}</span>
                      {c.priority === "high" && (
                        <span className="badge bg-red-50 text-red-700"><Flame size={11} /> High</span>
                      )}
                      {c.overdueTask && <span className="badge bg-amber-50 text-amber-800">Task overdue</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {c.ageDays === 0 ? "today" : `${c.ageDays}d`}</span>
                      {c.valueFils ? <span className="font-bold text-text">{aed(c.valueFils, { compact: true })}</span> : <span />}
                      {c.owner ? <Avatar name={c.owner} size={24} /> : <span className="text-[11px]">Unassigned</span>}
                    </div>
                    {canWrite && (
                      // keyboard / touch alternative to dragging
                      <label className="mt-3 block lg:sr-only lg:focus-within:not-sr-only">
                        <span className="sr-only">Move {c.title} to stage</span>
                        <select
                          value={c.stage}
                          onChange={(e) => move(c.id, e.target.value)}
                          className="field-sm !min-h-[36px] !py-1.5 text-[13px] font-semibold"
                        >
                          {STAGES.map((st) => (
                            <option key={st.id} value={st.id}>Move to: {st.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </li>
                ))}
                {col.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-2xl border border-dashed border-line py-6 text-xs text-muted">
                    {canWrite ? "Drop here" : "Nothing here"}
                  </li>
                )}
                {col.length > shown.length && (
                  <li className="px-2 py-1 text-center text-xs font-semibold text-muted">
                    +{col.length - shown.length} more · <Link href={`/admin/enquiries?view=list&stage=${s.id}`} className="text-brand underline">view all</Link>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {lost && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Why was this enquiry lost?">
          <form
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              const reason = String(new FormData(e.currentTarget).get("reason"));
              const id = lost.id;
              setLost(null);
              move(id, "lost", reason);
            }}
          >
            <h2 className="font-display text-lg font-bold">Why was it lost?</h2>
            <p className="mt-1 text-sm text-muted">This helps us learn what to improve.</p>
            <select name="reason" className="field-sm mt-4" defaultValue={LOST_REASONS[0]} autoFocus>
              {LOST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setLost(null)} className="btn btn-outline !min-h-[42px] !px-5 text-sm">Cancel</button>
              <button className="btn btn-brand !min-h-[42px] !px-5 text-sm">Mark as lost</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
