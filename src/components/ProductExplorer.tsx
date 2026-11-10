"use client";

import { ArrowRight, Check } from "lucide-react";
import { products } from "@/lib/site";
import { ProductGlyph } from "./Icon";
import { Reveal } from "./Reveal";

export function ProductExplorer() {
  function enquire(slug: string) {
    window.dispatchEvent(new CustomEvent("rad:interest", { detail: slug }));
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
      {products.map((p, i) => {
        // bento: first card is a wide feature, the rest tile evenly
        const wide = i === 0;
        return (
          <Reveal
            key={p.slug}
            delay={i * 70}
            className={wide ? "lg:col-span-6" : i < 3 ? "lg:col-span-3" : "lg:col-span-3"}
          >
            <article
              id={p.slug}
              className={`card card-hover group relative h-full scroll-mt-32 overflow-hidden p-7 sm:p-9 ${
                wide ? "lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-12" : ""
              }`}
            >
              <div className={wide ? "relative" : "relative flex h-full flex-col"}>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand transition group-hover:bg-linear-to-br group-hover:from-orange group-hover:to-pink group-hover:text-white">
                  <ProductGlyph name={p.icon} size={26} />
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold leading-tight">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{p.description}</p>
                {!wide && (
                  <button
                    type="button"
                    onClick={() => enquire(p.slug)}
                    className="btn btn-outline mt-auto !w-fit self-start !px-5 mt-7"
                  >
                    Enquire <ArrowRight size={16} />
                  </button>
                )}
              </div>
              <div className={wide ? "relative mt-8 lg:mt-0" : "mt-7"}>
                <ul className={`grid gap-3 ${wide ? "sm:grid-cols-2 lg:grid-cols-1" : "sm:grid-cols-2"}`}>
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-[15px] font-semibold">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
                {wide && (
                  <button type="button" onClick={() => enquire(p.slug)} className="btn btn-brand mt-7">
                    Enquire about this <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
