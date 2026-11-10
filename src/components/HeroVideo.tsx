"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};
const shouldSkip = () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return reduce || !!conn?.saveData;
};

/**
 * Optional real footage. Drop an MP4 at /public/media/hero.mp4 and it fades in over
 * the animated packaging-line scene. If the file is missing, or the visitor prefers
 * reduced motion / data saving, the animated scene underneath simply stays visible.
 */
export function HeroVideo({ src = "/media/hero.mp4" }: { src?: string }) {
  const [ready, setReady] = useState(false);
  const skip = useSyncExternalStore(noop, shouldSkip, () => true);

  if (skip) return null;
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      onError={() => setReady(false)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
        ready ? "opacity-90" : "opacity-0"
      }`}
    />
  );
}
