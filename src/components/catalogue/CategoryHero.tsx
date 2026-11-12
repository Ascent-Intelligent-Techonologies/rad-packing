"use client";

import { usePathname } from "next/navigation";
import { categoryHref, parseCatalogueLocation } from "@/lib/catalogue/shared";
import { Breadcrumbs } from "./Breadcrumbs";

/**
 * The words in a category page's hero. They follow the address bar, so when the visitor switches
 * category in place (no page reload) the heading above the catalogue changes with it.
 */
export type HeroCategory = { path: string[]; name: string; intro: string | null };

function useCurrent(categories: HeroCategory[]) {
  const pathname = usePathname();
  const joined = parseCatalogueLocation(pathname, "")?.categoryPath ?? "";
  const byPath = new Map(categories.map((c) => [c.path.join("/"), c]));
  const cat = byPath.get(joined) ?? null;
  const chain = cat ? cat.path.map((_, i) => byPath.get(cat.path.slice(0, i + 1).join("/"))).filter((c) => !!c) : [];
  return { cat, chain };
}

export function HeroCrumbs({ categories }: { categories: HeroCategory[] }) {
  const { chain } = useCurrent(categories);
  return (
    <Breadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label: "Products", href: "/products" },
        ...chain.map((c) => ({ label: c.name, href: categoryHref(c.path) })),
      ]}
    />
  );
}

export function HeroEyebrow({ categories }: { categories: HeroCategory[] }) {
  const { cat, chain } = useCurrent(categories);
  if (!cat) return <>Our products &amp; solutions</>;
  return <>{chain.length > 1 ? chain[chain.length - 2]!.name : "Product category"}</>;
}

export function HeroTitle({ categories }: { categories: HeroCategory[] }) {
  const { cat } = useCurrent(categories);
  return <>{cat ? cat.name : "All products"}</>;
}

export function HeroIntro({ categories }: { categories: HeroCategory[] }) {
  const { cat } = useCurrent(categories);
  const text = cat
    ? cat.intro
    : "Barrier films, corrosion inhibitors, moisture control, wooden and traditional packaging, and turnkey packing services.";
  return text ? <p className="whitespace-pre-line">{text}</p> : null;
}
