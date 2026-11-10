"use client";

import { useEffect, useRef, useState } from "react";

/** Fades/slides content in as it scrolls into view. Content is visible without JS. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) {
      return; // already on screen: leave visible, no flash
    }
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const T = Tag as React.ElementType;
  return (
    <T
      ref={ref}
      className={className}
      data-reveal={state === "idle" ? undefined : state}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </T>
  );
}
