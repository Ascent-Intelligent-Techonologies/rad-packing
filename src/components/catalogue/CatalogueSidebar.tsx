"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { categoryHref, isPlainClick } from "@/lib/catalogue/shared";
import type { PublicCategory } from "@/lib/catalogue/public";

/**
 * The category hierarchy as a nested list with product counts.
 * On phones it folds into a "Browse categories" disclosure; from `lg` it is always open and sticks
 * to the top while scrolling. `onSelect` filters the product area in place (null = all products);
 * the links are still real links, so they work without JavaScript and in a new tab.
 */
export function CatalogueSidebar({
  categories,
  activeId,
  total,
  onSelect,
}: {
  categories: PublicCategory[];
  activeId?: string;
  total: number;
  onSelect?: (path: string[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = categories.find((c) => c.id === activeId);
  const activePath = new Set(active ? active.path : []);

  const pick = (e: React.MouseEvent, path: string[] | null) => {
    if (!onSelect || !isPlainClick(e)) return;
    e.preventDefault();
    onSelect(path);
    setOpen(false);
  };

  const list = (
    <nav aria-label="Product categories">
      <ul className="space-y-1">
        <li>
          <Link
            href="/products"
            prefetch={false}
            onClick={(e) => pick(e, null)}
            aria-current={!activeId ? "page" : undefined}
            className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3 text-[15px] font-bold transition ${
              !activeId ? "bg-brand text-white shadow-md" : "text-text hover:bg-brand-50"
            }`}
          >
            All products <span className={`text-xs ${!activeId ? "text-white/80" : "text-muted"}`}>{total}</span>
          </Link>
        </li>
        {categories.map((c) => {
          const isActive = c.id === activeId;
          const inBranch = activePath.has(c.slug);
          return (
            <li key={c.id}>
              <Link
                href={categoryHref(c.path)}
                prefetch={false}
                onClick={(e) => pick(e, c.path)}
                aria-current={isActive ? "page" : undefined}
                style={{ paddingLeft: `${12 + c.depth * 18}px` }}
                className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl pr-3 transition ${
                  isActive ? "bg-brand text-white shadow-md" : inBranch ? "bg-brand-50 text-brand" : "text-text hover:bg-brand-50"
                } ${c.depth === 0 ? "text-[15px] font-bold" : "text-[14.5px] font-semibold"}`}
              >
                <span className="min-w-0 truncate">{c.name}</span>
                <span className={`text-xs ${isActive ? "text-white/80" : "text-muted"}`}>{c.total}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="card group overflow-hidden lg:hidden">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 font-display text-base font-bold [&::-webkit-details-marker]:hidden">
          <span>
            Browse categories
            {active && <span className="ml-2 text-sm font-semibold text-brand">· {active.name}</span>}
          </span>
          <ChevronDown size={18} className="transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-line p-3">{list}</div>
      </details>
      <div className="card sticky top-24 hidden p-3 lg:block">
        <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Categories</p>
        {list}
      </div>
    </>
  );
}
