/**
 * Pure helpers shared by the public catalogue pages and the admin editor.
 * No database or server-only imports here, so client components can use it too.
 */

/** Icon keys a category/product can use for its placeholder tile (see components/catalogue/CatalogIcon). */
export const CATEGORY_ICONS = [
  "shield",
  "box",
  "layers",
  "truck",
  "leaf",
  "wrench",
  "package",
  "droplets",
  "flask",
  "gauge",
  "container",
  "scroll",
  "hammer",
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];
export const isCategoryIcon = (v: unknown): v is CategoryIcon => (CATEGORY_ICONS as readonly string[]).includes(v as string);

/** `/products/<slug>` is a product, so these words can never be a product slug. */
export const RESERVED_PRODUCT_SLUGS = ["category", "new", "page", "all", "tag"] as const;

export const LIMITS = {
  title: 160,
  name: 120,
  summary: 240,
  description: 8000,
  highlight: 120,
  highlights: 12,
  specLabel: 60,
  specValue: 160,
  specs: 30,
  tag: 40,
  tags: 20,
  imagesPerProduct: 12,
  imagesPerCategory: 1,
  alt: 200,
} as const;

/** Image rules, enforced in the browser (resize) and again on the server (upload route). */
export const IMAGE = {
  fullPx: 1600, //      longest side of the stored "full" picture
  thumbPx: 480, //      longest side of the grid thumbnail
  maxFullBytes: 3_500_000,
  maxThumbBytes: 400_000,
  accept: "image/jpeg,image/png,image/webp",
} as const;

export const PAGE_SIZE = 12;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// ── text <-> lists ───────────────────────────────────────────────────────────

export type SpecRow = { label: string; value: string };

/** One "Label: value" per line. Lines without a colon are ignored. */
export function parseSpecs(text: string): SpecRow[] {
  const rows: SpecRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    const label = line.slice(0, i).trim().slice(0, LIMITS.specLabel);
    const value = line.slice(i + 1).trim().slice(0, LIMITS.specValue);
    if (label && value) rows.push({ label, value });
    if (rows.length >= LIMITS.specs) break;
  }
  return rows;
}
export const specsToText = (rows: SpecRow[] | null | undefined) => (rows ?? []).map((r) => `${r.label}: ${r.value}`).join("\n");

/** Stored JSON → clean rows (defensive: the column is untyped). */
export function readSpecs(json: unknown): SpecRow[] {
  if (!Array.isArray(json)) return [];
  const out: SpecRow[] = [];
  for (const r of json) {
    if (r && typeof r === "object" && typeof (r as SpecRow).label === "string" && typeof (r as SpecRow).value === "string") {
      out.push({ label: (r as SpecRow).label, value: (r as SpecRow).value });
    }
  }
  return out;
}

/** One item per line. */
export function parseLines(text: string, max: number, maxLen: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.replace(/^\s*[-•*]\s*/, "").trim().slice(0, maxLen);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Comma- or newline-separated. */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const s = raw.trim().replace(/\s+/g, " ").slice(0, LIMITS.tag);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= LIMITS.tags) break;
  }
  return out;
}

// ── URLs ─────────────────────────────────────────────────────────────────────

export const productHref = (slug: string) => `/products/${slug}`;
/** `path` = slugs from the top-level category down, e.g. ["preservation", "anti-corrosion"]. */
export const categoryHref = (path: string[]) => `/products/category/${path.join("/")}`;
export const imageSrc = (id: string, size: "full" | "thumb" = "full") => (size === "thumb" ? `/media/${id}?s=thumb` : `/media/${id}`);

// ── category tree ────────────────────────────────────────────────────────────

export type FlatCategory = { id: string; parentId: string | null; slug: string; name: string; position: number };

export type CategoryIndex<T extends FlatCategory> = {
  byId: Map<string, T>;
  childrenOf: (id: string | null) => T[];
  /** Root → … → this category. Empty when the id is unknown or the chain is broken. */
  chain: (id: string) => T[];
  /** The category and every descendant id. */
  subtreeIds: (id: string) => string[];
  /** Depth-first, siblings ordered, with depth. */
  flatten: () => { cat: T; depth: number }[];
};

export function indexCategories<T extends FlatCategory>(cats: T[]): CategoryIndex<T> {
  const byId = new Map(cats.map((c) => [c.id, c]));
  const kids = new Map<string | null, T[]>();
  for (const c of cats) {
    const key = c.parentId && byId.has(c.parentId) ? c.parentId : null;
    (kids.get(key) ?? kids.set(key, []).get(key)!).push(c);
  }
  for (const list of kids.values()) list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const childrenOf = (id: string | null) => kids.get(id) ?? [];
  const chain = (id: string) => {
    const out: T[] = [];
    let cur = byId.get(id);
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      out.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return out;
  };
  const subtreeIds = (id: string) => {
    const out: string[] = [];
    const walk = (x: string) => {
      out.push(x);
      for (const k of childrenOf(x)) if (!out.includes(k.id)) walk(k.id);
    };
    walk(id);
    return out;
  };
  const flatten = () => {
    const out: { cat: T; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const c of childrenOf(parent)) {
        out.push({ cat: c, depth });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  };
  return { byId, childrenOf, chain, subtreeIds, flatten };
}

/** Maximum nesting we allow in the editor (category → sub-category → sub-sub-category). */
export const MAX_DEPTH = 3;

// ── in-page catalogue navigation ─────────────────────────────────────────────

/** What the product area is showing: a category (slugs joined with "/", "" = all), a search, a page. */
export type CatalogueView = { categoryPath: string; q: string; page: number };

export function catalogueUrl(v: CatalogueView): string {
  const base = v.categoryPath ? `/products/category/${v.categoryPath}` : "/products";
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.page > 1) p.set("page", String(v.page));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

/** The inverse of catalogueUrl. Null when the address isn't a catalogue listing. */
export function parseCatalogueLocation(pathname: string, search: string): CatalogueView | null {
  let categoryPath: string;
  if (pathname === "/products" || pathname === "/products/") categoryPath = "";
  else if (pathname.startsWith("/products/category/")) categoryPath = pathname.slice("/products/category/".length).replace(/\/+$/, "");
  else return null;
  const sp = new URLSearchParams(search);
  return {
    categoryPath,
    q: (sp.get("q") ?? "").trim().slice(0, 80),
    page: Math.max(1, Math.min(1000, parseInt(sp.get("page") ?? "", 10) || 1)),
  };
}

/** True for a normal left click, so links keep working for "open in new tab" and the like. */
export const isPlainClick = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
