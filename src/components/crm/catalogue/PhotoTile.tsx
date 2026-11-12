"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Loader2, Star, Trash2, TriangleAlert } from "lucide-react";
import { LIMITS } from "@/lib/catalogue/shared";

/** One picture in the uploader. `id` is the saved CatalogImage id; it is null until the upload finishes. */
export type PhotoItem = {
  key: string;
  id: string | null;
  alt: string;
  /** thumbnail URL: the server copy for saved photos, a local preview for fresh ones */
  src: string | null;
  state: "busy" | "ready" | "failed";
  /** busy: progress text, failed: what went wrong */
  note?: string;
};

export type DragHandlers = {
  /** something from this list is being dragged */
  active: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropHere: () => void;
};

const iconButton =
  "grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-text transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-text";

/** A photo with its alt text and the move / cover / remove controls. */
export function PhotoTile({
  photo,
  index,
  count,
  single,
  noun,
  drag,
  onAlt,
  onMove,
  onCover,
  onRemove,
}: {
  photo: PhotoItem;
  index: number;
  count: number;
  single: boolean;
  noun: string;
  drag: DragHandlers;
  onAlt: (alt: string) => void;
  onMove: (delta: -1 | 1) => void;
  onCover: () => void;
  onRemove: () => void;
}) {
  const ready = photo.state === "ready";
  const name = `${noun} ${index + 1}`;
  const canReorder = ready && !single && count > 1;
  return (
    <li
      onDragOver={(e) => {
        if (drag.active) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!drag.active) return;
        e.preventDefault();
        e.stopPropagation();
        drag.onDropHere();
      }}
      className={`flex gap-3 rounded-2xl border bg-white p-3 sm:flex-col ${
        photo.state === "failed" ? "border-red-200 bg-red-50/50" : "border-line"
      } ${drag.dragging ? "opacity-50" : ""}`}
    >
      <div
        draggable={canReorder}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", photo.key);
          drag.onDragStart();
        }}
        onDragEnd={drag.onDragEnd}
        className={`relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 sm:aspect-square sm:h-auto sm:w-full ${
          canReorder ? "md:cursor-grab" : ""
        }`}
      >
        {photo.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview or our own /media route
          <img src={photo.src} alt={name} draggable={false} className="h-full w-full object-cover" />
        ) : photo.state === "failed" ? (
          <TriangleAlert size={24} className="text-red-500" aria-hidden="true" />
        ) : null}
        {photo.state === "busy" && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 text-brand">
            <Loader2 size={22} className="animate-spin" aria-hidden="true" />
          </span>
        )}
        {index === 0 && ready && !single && (
          <span className="badge absolute left-1.5 top-1.5 bg-brand text-white shadow">Cover</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {photo.state === "busy" && (
          <p className="text-sm text-muted" role="status">
            {photo.note ?? "Working…"}
          </p>
        )}
        {photo.state === "failed" && (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {photo.note}
          </p>
        )}
        {ready && (
          <input
            value={photo.alt}
            onChange={(e) => onAlt(e.target.value)}
            maxLength={LIMITS.alt}
            placeholder="Describe the photo, e.g. 'VCI film roll'"
            aria-label={`Description of ${name}`}
            className="field-sm"
          />
        )}
        {photo.state !== "busy" && (
          <div className="flex flex-wrap gap-1.5">
            {canReorder && (
              <>
                <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${name} earlier`} title="Move earlier" className={iconButton}>
                  <ArrowUp size={18} className="sm:hidden" aria-hidden="true" />
                  <ArrowLeft size={18} className="hidden sm:block" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${name} later`} title="Move later" className={iconButton}>
                  <ArrowDown size={18} className="sm:hidden" aria-hidden="true" />
                  <ArrowRight size={18} className="hidden sm:block" aria-hidden="true" />
                </button>
                {index > 0 && (
                  <button type="button" onClick={onCover} aria-label={`Make ${name} the cover photo`} title="Make cover" className={iconButton}>
                    <Star size={18} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onRemove}
              aria-label={ready ? `Remove ${name}` : `Dismiss message for ${name}`}
              title={ready ? "Remove" : "Dismiss"}
              className={`${iconButton} text-red-600 hover:!border-red-300 hover:!text-red-600`}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
