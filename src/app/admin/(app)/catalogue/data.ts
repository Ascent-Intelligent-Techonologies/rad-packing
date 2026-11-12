import "server-only";
import type { CategoryOption } from "@/components/crm/catalogue/CategorySelect";
import { MAX_DEPTH, indexCategories, type CategoryIndex, type FlatCategory } from "@/lib/catalogue/shared";
import { getDb } from "@/lib/db";

export type CategoryRow = FlatCategory & {
  summary: string | null;
  icon: string | null;
  published: boolean;
  /** products filed directly under this category */
  products: number;
  /** id of the cover photo, if any */
  cover: string | null;
};

/** Every category (the tree is small), with direct product counts and cover photo ids. */
export async function loadCategories(): Promise<CategoryRow[]> {
  const rows = await getDb()!.catalogCategory.findMany({
    select: {
      id: true,
      parentId: true,
      slug: true,
      name: true,
      position: true,
      summary: true,
      icon: true,
      published: true,
      _count: { select: { products: true } },
      images: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });
  return rows.map(({ _count, images, ...c }) => ({ ...c, products: _count.products, cover: images[0]?.id ?? null }));
}

export const loadCategoryIndex = async () => indexCategories(await loadCategories());

/** Number of levels in the subtree rooted at `id`, counting the category itself (a leaf is 1). */
export function subtreeHeight(index: CategoryIndex<CategoryRow>, id: string): number {
  const seen = new Set<string>();
  const levels = (x: string): number => {
    if (seen.has(x)) return 0;
    seen.add(x);
    return 1 + Math.max(0, ...index.childrenOf(x).map((k) => levels(k.id)));
  };
  return levels(id);
}

/**
 * Categories as indented select options. `moving` = a category being edited: it and its
 * descendants are left out, and so is any place that would push its subtree past MAX_DEPTH.
 * Without `moving` every category is listed.
 */
export function categoryOptions(index: CategoryIndex<CategoryRow>, moving?: { id: string | null }): CategoryOption[] {
  const height = moving ? (moving.id ? subtreeHeight(index, moving.id) : 1) : 0;
  const blocked = new Set(moving?.id ? index.subtreeIds(moving.id) : []);
  return index
    .flatten()
    .filter(({ cat, depth }) => !blocked.has(cat.id) && (!moving || depth + 1 + height <= MAX_DEPTH))
    .map(({ cat, depth }) => ({ id: cat.id, name: cat.name, depth, published: cat.published }));
}

/** "Preservation › Anti-Corrosion" */
export const categoryPath = (index: CategoryIndex<CategoryRow>, id: string) =>
  index
    .chain(id)
    .map((c) => c.name)
    .join(" › ");

/** A category is only visible on the website when it and every parent above it is published. */
export const isCategoryVisible = (index: CategoryIndex<CategoryRow>, id: string) => {
  const chain = index.chain(id);
  return chain.length > 0 && chain.every((c) => c.published);
};

/** First value of a search param, trimmed. */
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? "")).trim();
