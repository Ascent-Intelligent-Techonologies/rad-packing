import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { site } from "@/lib/site";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail for the dark page hero, plus BreadcrumbList structured data. */
export function Breadcrumbs({ items, tone = "dark" }: { items: Crumb[]; tone?: "dark" | "light" }) {
  const light = tone === "light";
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site.url}${c.href}` } : {}),
    })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm ${light ? "text-muted" : "text-white/70"}`}>
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className={light ? "text-muted/60" : "text-white/40"} aria-hidden="true" />}
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className={`font-semibold hover:underline ${light ? "hover:text-brand" : "hover:text-white"}`}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === items.length - 1 ? "page" : undefined} className={`font-semibold ${light ? "text-text" : "text-white"}`}>
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {/* JSON-LD built from our own data; "<" is escaped so nothing in it can close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
