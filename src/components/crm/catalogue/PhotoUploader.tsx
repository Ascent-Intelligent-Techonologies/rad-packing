"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ImagePlus } from "lucide-react";
import { IMAGE, imageSrc } from "@/lib/catalogue/shared";
import { PhotoTile, type PhotoItem } from "./PhotoTile";
import { checkFile, PhotoError, preparePhoto, uploadPhoto } from "./photo-pipeline";

export type { PhotoItem } from "./PhotoTile";

/** Photos already saved in the database → uploader state. */
export const photoItemsFrom = (images: { id: string; alt: string }[]): PhotoItem[] =>
  images.map((i) => ({ key: i.id, id: i.id, alt: i.alt, src: imageSrc(i.id, "thumb"), state: "ready" }));

/** True while any picture is still being resized or uploaded (saving now would leave it out). */
export const hasPendingPhotos = (photos: PhotoItem[]) => photos.some((p) => p.state === "busy");

/**
 * Multi-photo uploader. The parent owns the list (so it can block Saving mid-upload);
 * this component renders it, handles choosing / dropping files and writes the final order into
 * one hidden input as JSON: [{ "id": "...", "alt": "..." }].
 */
export function PhotoUploader({
  photos,
  onChange,
  max,
  noun = "photo",
  name = "images",
}: {
  photos: PhotoItem[];
  onChange: Dispatch<SetStateAction<PhotoItem[]>>;
  max: number;
  noun?: string;
  name?: string;
}) {
  const single = max === 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const previews = useRef(new Set<string>());
  const [notes, setNotes] = useState<string[]>([]);
  const [fileOver, setFileOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const used = photos.filter((p) => p.state !== "failed").length;
  const canAdd = single || used < max;

  const patch = (key: string, change: Partial<PhotoItem>) =>
    onChange((prev) => prev.map((p) => (p.key === key ? { ...p, ...change } : p)));

  const forget = (photo: PhotoItem) => {
    if (photo.src && previews.current.delete(photo.src)) URL.revokeObjectURL(photo.src);
  };

  /** Runs one file through resize → upload. Never throws: problems end up on the tile. */
  const handleFile = async (file: File, key: string) => {
    try {
      patch(key, { note: "Resizing…" });
      const prepared = await preparePhoto(file);
      const preview = URL.createObjectURL(prepared.thumb);
      previews.current.add(preview);
      patch(key, { src: preview, note: "Uploading…" });
      const id = await uploadPhoto(prepared, (pct) => patch(key, { note: `Uploading ${pct}%` }));
      patch(key, { id, state: "ready", note: undefined });
    } catch (e) {
      patch(key, { state: "failed", note: e instanceof PhotoError ? e.message : `Something went wrong with "${file.name}". Please try again.` });
    }
  };

  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    const messages: string[] = [];
    const room = single ? 1 : max - used;
    const accepted: { file: File; key: string }[] = [];
    let skipped = 0;
    for (const file of files) {
      const problem = checkFile(file);
      if (problem) messages.push(problem);
      else if (accepted.length >= room) skipped++;
      else accepted.push({ file, key: `new-${++counter.current}` });
    }
    if (skipped) messages.push(`You can add up to ${max} ${noun}s. ${skipped} ${skipped === 1 ? "picture was" : "pictures were"} not added.`);
    setNotes(messages);
    if (!accepted.length) return;

    const fresh: PhotoItem[] = accepted.map(({ key }) => ({ key, id: null, alt: "", src: null, state: "busy", note: "Waiting…" }));
    if (single) photos.forEach(forget);
    onChange((prev) => (single ? fresh : [...prev, ...fresh]));
    // one at a time keeps memory use low on phones
    for (const { file, key } of accepted) queue.current = queue.current.then(() => handleFile(file, key));
  };

  const reorder = (fromKey: string, toKey: string) =>
    onChange((prev) => {
      const from = prev.findIndex((p) => p.key === fromKey);
      const to = prev.findIndex((p) => p.key === toKey);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]!);
      return next;
    });

  const move = (index: number, to: number) =>
    onChange((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      next.splice(to, 0, next.splice(index, 1)[0]!);
      return next;
    });

  const remove = (photo: PhotoItem) => {
    forget(photo);
    onChange((prev) => prev.filter((p) => p.key !== photo.key));
  };

  const value = JSON.stringify(photos.filter((p) => p.state === "ready" && p.id).map((p) => ({ id: p.id, alt: p.alt.trim() })));
  const carriesFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <div
      onDragOver={(e) => {
        if (!carriesFiles(e)) return;
        e.preventDefault();
        setFileOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFileOver(false);
      }}
      onDrop={(e) => {
        if (!carriesFiles(e)) return;
        e.preventDefault();
        setFileOver(false);
        addFiles(e.dataTransfer.files);
      }}
      className={`space-y-3 rounded-2xl ${fileOver ? "bg-brand-50 outline-2 outline-dashed outline-offset-4 outline-brand" : ""}`}
    >
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE.accept}
        multiple={!single}
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={`${noun}s`}>
          {photos.map((photo, index) => (
            <PhotoTile
              key={photo.key}
              photo={photo}
              index={index}
              count={photos.length}
              single={single}
              noun={noun}
              drag={{
                active: dragKey !== null,
                dragging: dragKey === photo.key,
                onDragStart: () => setDragKey(photo.key),
                onDragEnd: () => setDragKey(null),
                onDropHere: () => {
                  if (dragKey) reorder(dragKey, photo.key);
                  setDragKey(null);
                },
              }}
              onAlt={(alt) => patch(photo.key, { alt })}
              onMove={(delta) => move(index, index + delta)}
              onCover={() => move(index, 0)}
              onRemove={() => remove(photo)}
            />
          ))}
        </ul>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[72px] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-white px-4 py-4 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex items-center gap-2">
            <ImagePlus size={20} aria-hidden="true" />
            {single ? (photos.length ? `Replace ${noun}` : `Choose a ${noun}`) : photos.length ? `Add more ${noun}s` : `Choose ${noun}s`}
          </span>
          <span className="hidden text-xs font-normal text-muted md:block">or drag and drop pictures here</span>
        </button>
      )}

      <div aria-live="polite" className="space-y-1">
        {notes.map((n) => (
          <p key={n} className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-800">
            {n}
          </p>
        ))}
      </div>

      <p className="text-xs text-muted">
        {single ? "" : `${used} of ${max} ${noun}s. The first one is the cover. `}
        JPG, PNG or WebP; big pictures are resized automatically.{" "}
        {single ? `The ${noun} is` : `${noun[0]!.toUpperCase()}${noun.slice(1)}s are`} attached when you press Save.
      </p>
    </div>
  );
}
