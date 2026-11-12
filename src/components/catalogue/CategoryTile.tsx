"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryHref, isPlainClick } from "@/lib/catalogue/shared";
import type { PublicCategory } from "@/lib/catalogue/public";
import { CatalogIcon } from "./CatalogIcon";
import { CatalogPhoto } from "./CatalogPhoto";

/** Entry point into one branch of the catalogue. `onSelect` filters in place; without it it's a normal link. */
export function CategoryTile({ c, onSelect }: { c: PublicCategory; onSelect?: (path: string[]) => void }) {
  return (
    <Link
      href={categoryHref(c.path)}
      prefetch={false}
      onClick={(e) => {
        if (!onSelect || !isPlainClick(e)) return;
        e.preventDefault();
        onSelect(c.path);
      }}
      className="card card-hover group flex min-h-[112px] items-center gap-4 p-4 sm:p-5"
    >
      {c.cover ? (
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface sm:h-[72px] sm:w-[72px]">
          <CatalogPhoto image={c.cover} alt={c.name} className="h-full w-full" sizes="72px" />
        </span>
      ) : (
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand transition group-hover:bg-linear-to-br group-hover:from-orange group-hover:to-pink group-hover:text-white sm:h-[72px] sm:w-[72px]">
          <CatalogIcon name={c.icon} size={28} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] font-bold leading-snug">{c.name}</span>
        {c.summary && <span className="mt-1 line-clamp-2 block text-sm leading-snug text-muted">{c.summary}</span>}
        <span className="mt-1.5 block text-xs font-bold text-brand">
          {c.total} {c.total === 1 ? "product" : "products"}
        </span>
      </span>
      <ArrowRight size={18} className="shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
    </Link>
  );
}
