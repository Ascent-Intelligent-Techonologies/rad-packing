import "server-only";
import { cache } from "react";
import { getDb } from "@/lib/db";

export type CatalogueCounts = { products: number; published: number; categories: number };

/** Headline numbers for the catalogue tabs and stat cards. Deduplicated per request. */
export const catalogueCounts = cache(async (): Promise<CatalogueCounts> => {
  const db = getDb()!;
  const [products, published, categories] = await Promise.all([
    db.catalogProduct.count(),
    db.catalogProduct.count({ where: { published: true } }),
    db.catalogCategory.count(),
  ]);
  return { products, published, categories };
});
