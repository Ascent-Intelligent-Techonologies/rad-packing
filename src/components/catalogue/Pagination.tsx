"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isPlainClick } from "@/lib/catalogue/shared";

/** Numbered pagination made of real links (work without JavaScript); `onPage` swaps the page in place. */
export function Pagination({
  page,
  pages,
  hrefFor,
  onPage,
}: {
  page: number;
  pages: number;
  hrefFor: (n: number) => string;
  onPage?: (n: number) => void;
}) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const base = "grid h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-bold transition";
  const link = (n: number) => ({
    href: hrefFor(n),
    prefetch: false as const,
    onClick: (e: React.MouseEvent) => {
      if (!onPage || !isPlainClick(e)) return;
      e.preventDefault();
      onPage(n);
    },
  });
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link {...link(page - 1)} rel="prev" aria-label="Previous page" className={`${base} border border-line bg-white hover:border-brand/40`}>
          <ChevronLeft size={18} />
        </Link>
      ) : null}
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`gap${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
        ) : (
          <Link
            key={n}
            {...link(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "bg-brand text-white shadow-md" : "border border-line bg-white hover:border-brand/40"}`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link {...link(page + 1)} rel="next" aria-label="Next page" className={`${base} border border-line bg-white hover:border-brand/40`}>
          <ChevronRight size={18} />
        </Link>
      ) : null}
    </nav>
  );
}
