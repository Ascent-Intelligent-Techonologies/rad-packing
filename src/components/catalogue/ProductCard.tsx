"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryHref, isPlainClick, productHref } from "@/lib/catalogue/shared";
import type { ProductCardData } from "@/lib/catalogue/public";
import { CatalogPhoto } from "./CatalogPhoto";

/**
 * `onCategory` lets the catalogue page filter in place when the category label is clicked;
 * without it (e.g. on a product page) the label is an ordinary link.
 */
export function ProductCard({
  p,
  priority = false,
  onCategory,
}: {
  p: ProductCardData;
  priority?: boolean;
  onCategory?: (path: string[]) => void;
}) {
  return (
    <article className="card card-hover group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <CatalogPhoto
          image={p.cover}
          alt={p.title}
          icon={p.categoryIcon}
          art={{ slug: p.slug, title: p.title, tags: p.tags }}
          priority={priority}
          sizes="(min-width:1280px) 300px, (min-width:640px) 45vw, 92vw"
          className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
        />
        {p.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {p.categoryName && (
          <Link
            href={categoryHref(p.categoryPath)}
            prefetch={false}
            onClick={(e) => {
              if (!onCategory || !isPlainClick(e)) return;
              e.preventDefault();
              onCategory(p.categoryPath);
            }}
            className="relative z-10 w-fit text-xs font-bold uppercase tracking-wider text-brand hover:underline"
          >
            {p.categoryName}
          </Link>
        )}
        <h3 className="mt-2 font-display text-lg font-bold leading-snug">
          {/* the link covers the whole card; the category link above sits on top of it */}
          <Link href={productHref(p.slug)} className="after:absolute after:inset-0 after:content-['']">
            {p.title}
          </Link>
        </h3>
        {p.summary && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{p.summary}</p>}
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand">
          View details <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
