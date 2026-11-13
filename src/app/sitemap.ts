import type { MetadataRoute } from "next";
import { getCatalogueIndexForSeo } from "@/lib/catalogue/public";
import { categoryHref, productHref } from "@/lib/catalogue/shared";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/about", "/products", "/contact", "/privacy-policy", "/accessibility-statement", "/photo-credits"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  // catalogue pages come from the database, so new products appear here as soon as they are published
  const { products, categories } = await getCatalogueIndexForSeo().catch(() => ({ products: [], categories: [] }));
  return [
    ...pages,
    ...categories.map((c) => ({ url: `${site.url}${categoryHref(c.path)}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${site.url}${productHref(p.slug)}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
