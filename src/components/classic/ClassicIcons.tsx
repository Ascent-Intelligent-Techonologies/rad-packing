import { Lock, Truck } from "lucide-react";
import type { WhatWeDoIcon } from "./content";

/** A solid cog, like the first "What We Do" card on the original page. */
function Gear({ size }: { size: number }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <mask id="cl-gear-hole">
        <rect width="100" height="100" fill="#fff" />
        <circle cx="50" cy="50" r="13.5" fill="#000" />
      </mask>
      <g fill="#fff" mask="url(#cl-gear-hole)">
        <circle cx="50" cy="50" r="34" />
        {teeth.map((a) => (
          <rect key={a} x="40" y="2" width="20" height="24" rx="6" transform={`rotate(${a} 50 50)`} />
        ))}
      </g>
    </svg>
  );
}

/** An open box with two leaves growing out of it. */
function EcoBox({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 46 48 58l34-12v32L48 90 14 78Z" />
      <path d="M48 58v32" />
      <path d="M14 46 4 56l34 12 10-10M82 46l10 10-34 12-10-10" />
      <path d="M14 46 36 38M82 46 60 38" />
      <path d="M48 52V32" />
      <path d="M48 36c-13 0-20-8-22-24 15 0 22 9 22 24Z" />
      <path d="M48 32c0-13 7-21 22-23-1 15-9 23-22 23Z" />
    </svg>
  );
}

export function WhatWeDoGlyph({ name }: { name: WhatWeDoIcon }) {
  switch (name) {
    case "gear":
      return <Gear size={84} />;
    case "lock":
      return <Lock size={94} strokeWidth={1.15} aria-hidden="true" />;
    case "ecoBox":
      return <EcoBox size={94} />;
    case "truck":
      return <Truck size={88} strokeWidth={1.15} aria-hidden="true" />;
  }
}
