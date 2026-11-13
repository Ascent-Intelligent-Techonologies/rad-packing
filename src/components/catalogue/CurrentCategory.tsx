"use client";

import { usePathname } from "next/navigation";
import { categoryHref, parseCatalogueLocation } from "@/lib/catalogue/shared";
import { BreadcrumbData } from "./Breadcrumbs";

/**
 * The page title and breadcrumb data of a category page. They follow the address bar, so when the
 * visitor switches category in place (no page reload) they change with it.
 */
export type CategoryRef = { path: string[]; name: string };

function useCurrent(categories: CategoryRef[]) {
  const pathname = usePathname();
  const joined = parseCatalogueLocation(pathname, "")?.categoryPath ?? "";
  const byPath = new Map(categories.map((c) => [c.path.join("/"), c]));
  const cat = byPath.get(joined) ?? null;
  const chain = cat ? cat.path.map((_, i) => byPath.get(cat.path.slice(0, i + 1).join("/"))).filter((c) => !!c) : [];
  return { cat, chain };
}

export function CurrentCategoryTitle({ categories }: { categories: CategoryRef[] }) {
  const { cat } = useCurrent(categories);
  return <>{cat ? cat.name : "Products & Solutions"}</>;
}

/** BreadcrumbList structured data only; the visible trail is the one above the product list. */
export function CurrentCategoryCrumbData({ categories }: { categories: CategoryRef[] }) {
  const { chain } = useCurrent(categories);
  return (
    <BreadcrumbData
      items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        ...chain.map((c) => ({ label: c.name, href: categoryHref(c.path) })),
      ]}
    />
  );
}
