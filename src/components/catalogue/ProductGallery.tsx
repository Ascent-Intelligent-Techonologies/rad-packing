"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageSrc } from "@/lib/catalogue/shared";
import type { ImageRef } from "@/lib/catalogue/public";
import { CatalogPhoto } from "./CatalogPhoto";

/** Large photo with a thumbnail strip. Falls back to the icon tile when a product has no photos yet. */
export function ProductGallery({
  images,
  title,
  icon,
  slug,
  tags,
}: {
  images: ImageRef[];
  title: string;
  icon: string | null;
  slug: string;
  tags: string[];
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[Math.min(index, Math.max(0, count - 1))];
  const go = (n: number) => setIndex((n + count) % count);

  return (
    <div>
      <div className="relative overflow-hidden rounded-[24px] border border-line bg-white">
        <div className="aspect-[4/3]">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.id}
              src={imageSrc(current.id)}
              alt={current.alt || title}
              width={current.width}
              height={current.height}
              decoding="async"
              className="h-full w-full object-contain"
            />
          ) : (
            <CatalogPhoto image={null} alt={title} icon={icon} art={{ slug, title, tags }} className="h-full w-full" />
          )}
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-bold text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product photos">
          {images.map((im, i) => (
            <li key={im.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className={`block h-16 w-16 overflow-hidden rounded-xl border-2 bg-white transition sm:h-[72px] sm:w-[72px] ${
                  i === index ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <CatalogPhoto image={im} alt={title} className="h-full w-full" sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
