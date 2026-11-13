import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import { PAGE_SIZE, indexCategories, readSpecs, type SpecRow } from "./shared";

/**
 * Public, read-only catalogue queries. Everything here is cached under the "catalogue" tag;
 * the admin actions call updateTag("catalogue"), so edits show up on the website straight away.
 * Only published products in published categories (whose parents are published too) are returned.
 */

export type ImageRef = {
  id: string;
  alt: string | null;
  width: number;
  height: number;
  /** attribution for photos by other photographers (shown under the photo and on /photo-credits) */
  credit: string | null;
  creditUrl: string | null;
};

export type PublicCategory = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  position: number;
  summary: string | null;
  description: string | null;
  icon: string | null;
  /** slugs from the top-level category down to this one */
  path: string[];
  depth: number;
  /** published products directly in this category */
  direct: number;
  /** … including every sub-category */
  total: number;
  cover: ImageRef | null;
};

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  featured: boolean;
  tags: string[];
  categoryName: string;
  categoryPath: string[];
  categoryIcon: string | null;
  cover: ImageRef | null;
};

export type ProductPage = {
  items: ProductCardData[];
  total: number;
  page: number;
  pages: number;
  /** only set when a search inside a category found nothing: matches in the whole catalogue */
  alsoInAll?: number;
};

const imageFields = { id: true, alt: true, width: true, height: true, credit: true, creditUrl: true } as const;
const coverSelect = { orderBy: { position: "asc" as const }, take: 1, select: imageFields };

/** Visible categories (flat, tree order) with product counts. */
export async function getCategories(): Promise<PublicCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const db = getDb();
  if (!db) return [];
  const [rows, counts] = await Promise.all([
    db.catalogCategory.findMany({
      select: {
        id: true, parentId: true, slug: true, name: true, position: true, summary: true, description: true, icon: true, published: true,
        images: coverSelect,
      },
    }),
    db.catalogProduct.groupBy({ by: ["categoryId"], where: { published: true }, _count: { _all: true } }),
  ]);

  const all = indexCategories(rows);
  const visible = rows.filter((r) => {
    const chain = all.chain(r.id);
    return chain.length > 0 && chain.every((c) => c.published);
  });
  const vis = indexCategories(visible);
  const direct = new Map(counts.map((c) => [c.categoryId, c._count._all]));

  return vis.flatten().map(({ cat, depth }) => {
    const subtree = vis.subtreeIds(cat.id);
    return {
      id: cat.id,
      parentId: cat.parentId,
      slug: cat.slug,
      name: cat.name,
      position: cat.position,
      summary: cat.summary,
      description: cat.description,
      icon: cat.icon,
      path: vis.chain(cat.id).map((c) => c.slug),
      depth,
      direct: direct.get(cat.id) ?? 0,
      total: subtree.reduce((n, id) => n + (direct.get(id) ?? 0), 0),
      cover: cat.images[0] ?? null,
    };
  });
}

function cardFrom(
  p: {
    id: string; slug: string; title: string; summary: string | null; featured: boolean; tags: string[]; categoryId: string;
    images: ImageRef[];
  },
  byId: Map<string, PublicCategory>,
): ProductCardData {
  const c = byId.get(p.categoryId);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    featured: p.featured,
    tags: p.tags,
    categoryName: c?.name ?? "",
    categoryPath: c?.path ?? [],
    categoryIcon: c?.icon ?? null,
    cover: p.images[0] ?? null,
  };
}

const cardSelect = {
  id: true, slug: true, title: true, summary: true, featured: true, tags: true, categoryId: true,
  images: coverSelect,
} as const;

const order = [{ featured: "desc" as const }, { position: "asc" as const }, { createdAt: "desc" as const }, { id: "asc" as const }];

type IndexEntry = ProductCardData & {
  categoryId: string;
  position: number;
  createdAt: number;
  text: { title: string; tags: string; category: string; summary: string; body: string; squashed: string };
};

/** lowercase, accents and punctuation removed, single spaces */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Crude word stem so singular and plural find each other with a plain substring test:
 * "desiccants" -> "desiccant", "boxes" -> "box", "batteries" / "battery" -> "batter".
 */
function stem(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith("ies")) return w.slice(0, -3);
  if (w.endsWith("y")) return w.slice(0, -1);
  if (/(s|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  if (w.length >= 6 && w.endsWith("en")) return w.slice(0, -2); // wooden -> wood (finds "plywood")
  return w;
}

/** Every visible product with the text we search. One cached read; searching happens in memory. */
async function getCatalogueIndex(): Promise<IndexEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const db = getDb();
  if (!db) return [];
  const cats = await getCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const tree = indexCategories(cats);
  // a product is findable by its category and every parent category ("wooden" finds Pallets)
  const categoryText = new Map(cats.map((c) => [c.id, norm(tree.chain(c.id).map((x) => x.name).join(" "))]));
  const rows = await db.catalogProduct.findMany({
    where: { published: true, categoryId: { in: cats.map((c) => c.id) } },
    select: { ...cardSelect, position: true, createdAt: true, description: true },
    take: 3000,
  });
  return rows.map((r) => {
    const card = cardFrom(r, byId);
    const title = norm(r.title);
    const tags = norm(r.tags.join(" "));
    return {
      ...card,
      categoryId: r.categoryId,
      position: r.position,
      createdAt: r.createdAt.getTime(),
      text: {
        title,
        tags,
        category: categoryText.get(r.categoryId) ?? "",
        summary: norm(r.summary ?? ""),
        body: norm((r.description ?? "").slice(0, 2000)),
        squashed: `${title}${tags}`.replace(/ /g, ""),
      },
    };
  });
}

function scoreEntry(e: IndexEntry, tokens: string[]): number {
  let total = 0;
  for (const t of tokens) {
    const { title, tags, category, summary, body, squashed } = e.text;
    let best = 0;
    if (title.startsWith(t) || title.includes(` ${t}`)) best = 10;
    else if (title.includes(t)) best = 7;
    else if (tags.includes(t)) best = 5;
    else if (squashed.includes(t)) best = 4;
    else if (category.includes(t)) best = 3;
    else if (summary.includes(t)) best = 3;
    else if (body.includes(t)) best = 1;
    if (best === 0) return 0; // every word must match somewhere
    total += best;
  }
  return total;
}

/**
 * One page of products, optionally limited to a category (and its sub-categories) and/or a search.
 * Search is word based: every word must appear in the title, tags, category, summary or description
 * (in any order, singular or plural, with or without hyphens); title matches rank first.
 * When a search inside a category finds nothing, `alsoInAll` says how many matches the whole catalogue has.
 */
export async function searchCatalogue(categoryId: string, q: string, page: number): Promise<ProductPage> {
  const cats = await getCategories();
  const index = await getCatalogueIndex();
  const idx = indexCategories(cats);
  const scope = categoryId && idx.byId.has(categoryId) ? new Set(idx.subtreeIds(categoryId)) : null;

  const tokens = norm(q).split(" ").filter(Boolean).slice(0, 8).map(stem);
  const rank = (list: IndexEntry[]) =>
    list
      .map((e) => ({ e, score: tokens.length ? scoreEntry(e, tokens) : 1 }))
      .filter((x) => x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.e.featured) - Number(a.e.featured) ||
          a.e.position - b.e.position ||
          b.e.createdAt - a.e.createdAt,
      )
      .map((x) => x.e);

  const matches = rank(scope ? index.filter((e) => scope.has(e.categoryId)) : index);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pages);
  const items = matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    featured: e.featured,
    tags: e.tags,
    categoryName: e.categoryName,
    categoryPath: e.categoryPath,
    categoryIcon: e.categoryIcon,
    cover: e.cover,
  }));
  const result: ProductPage = { items, total: matches.length, page: safePage, pages };
  if (scope && tokens.length && matches.length === 0) result.alsoInAll = rank(index).length;
  return result;
}

export type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  highlights: string[];
  specs: SpecRow[];
  tags: string[];
  updatedAt: Date;
  images: ImageRef[];
  category: PublicCategory;
  /** root → … → the product's category */
  chain: PublicCategory[];
  related: ProductCardData[];
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const db = getDb();
  if (!db) return null;
  const p = await db.catalogProduct.findFirst({
    where: { slug, published: true },
    include: { images: { orderBy: { position: "asc" }, select: imageFields } },
  });
  if (!p) return null;

  const cats = await getCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const category = byId.get(p.categoryId);
  if (!category) return null; // its category (or a parent) is hidden

  const chain = indexCategories(cats).chain(category.id);
  const relatedRows = await db.catalogProduct.findMany({
    where: { published: true, categoryId: p.categoryId, NOT: { id: p.id } },
    orderBy: order,
    take: 4,
    select: cardSelect,
  });

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    highlights: p.highlights,
    specs: readSpecs(p.specs),
    tags: p.tags,
    updatedAt: p.updatedAt,
    images: p.images,
    category,
    chain,
    related: relatedRows.map((r) => cardFrom(r, byId)),
  };
}

/** Resolve `/products/category/a/b` (slugs joined with "/"). Null when it doesn't exist or isn't a valid chain. */
export async function getCategoryByPath(joined: string): Promise<{ category: PublicCategory; chain: PublicCategory[]; children: PublicCategory[] } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const slugs = joined.split("/").filter(Boolean);
  if (!slugs.length) return null;
  const cats = await getCategories();
  const category = cats.find((c) => c.slug === slugs[slugs.length - 1]);
  if (!category || category.path.join("/") !== slugs.join("/")) return null;
  const idx = indexCategories(cats);
  return { category, chain: idx.chain(category.id), children: idx.childrenOf(category.id) };
}

/** Everything the sitemap and static-params generation need. */
export async function getCatalogueIndexForSeo(): Promise<{
  products: { slug: string; updatedAt: Date }[];
  categories: { path: string[]; updatedAt: Date }[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const db = getDb();
  if (!db) return { products: [], categories: [] };
  const cats = await getCategories();
  const ids = cats.map((c) => c.id);
  const [products, catRows] = await Promise.all([
    db.catalogProduct.findMany({ where: { published: true, categoryId: { in: ids } }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 2000 }),
    db.catalogCategory.findMany({ where: { id: { in: ids } }, select: { id: true, updatedAt: true } }),
  ]);
  const updated = new Map(catRows.map((c) => [c.id, c.updatedAt]));
  return {
    products,
    categories: cats.map((c) => ({ path: c.path, updatedAt: updated.get(c.id) ?? new Date(0) })),
  };
}

export type PhotoCredit = { image: ImageRef; credit: string; creditUrl: string | null; productSlug: string; productTitle: string };

/** Every credited photo that is visible on the site, for the /photo-credits page. */
export async function getPhotoCredits(): Promise<PhotoCredit[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");

  const db = getDb();
  if (!db) return [];
  const cats = await getCategories();
  const rows = await db.catalogImage.findMany({
    where: { credit: { not: null }, product: { published: true, categoryId: { in: cats.map((c) => c.id) } } },
    orderBy: [{ product: { title: "asc" } }, { position: "asc" }],
    select: { ...imageFields, product: { select: { slug: true, title: true } } },
    take: 500,
  });
  return rows.flatMap((r) =>
    r.credit && r.product
      ? [{
          image: { id: r.id, alt: r.alt, width: r.width, height: r.height, credit: r.credit, creditUrl: r.creditUrl },
          credit: r.credit,
          creditUrl: r.creditUrl,
          productSlug: r.product.slug,
          productTitle: r.product.title,
        }]
      : [],
  );
}
