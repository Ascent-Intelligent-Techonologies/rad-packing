import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { catalogueCounts } from "./counts";

const TABS = [
  { id: "products", label: "Products", href: "/admin/catalogue" },
  { id: "categories", label: "Categories", href: "/admin/catalogue/categories" },
] as const;

export type CatalogueTab = (typeof TABS)[number]["id"];

/** Products | Categories switcher shown at the top of every catalogue page. */
export async function CatalogueTabs({ active }: { active: CatalogueTab }) {
  const counts = await catalogueCounts();
  const countOf: Record<CatalogueTab, number> = { products: counts.products, categories: counts.categories };
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <nav aria-label="Website catalogue">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const on = t.id === active;
            return (
              <li key={t.id}>
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                    on ? "border-brand bg-brand text-white" : "border-line bg-white text-text hover:border-brand/40"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${on ? "bg-white/20 text-white" : "bg-brand-50 text-brand"}`}
                  >
                    {countOf[t.id]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/products"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        View website catalogue <ExternalLink size={14} aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </Link>
    </div>
  );
}
