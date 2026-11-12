import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { LIMITS, RESERVED_PRODUCT_SLUGS, slugify } from "@/lib/catalogue/shared";

/**
 * Call after every successful catalogue change (from a Server Action only).
 * updateTag makes the public pages re-read the data on the very next request.
 */
export function publishChanges() {
  updateTag("catalogue");
  revalidatePath("/admin/catalogue", "layout");
}

/** Prisma error code (P2002 = unique clash, P2025 = row missing, P2003 = still referenced), if the error has one. */
export const errorCode = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && typeof e.code === "string" ? e.code : undefined;

export type PhotoRef = { id: string; alt: string | null };

/** The `images` hidden field: JSON [{ id, alt }] in display order. Duplicates are dropped. */
export function parsePhotoList(raw: FormDataEntryValue | null, max: number, noun: string): { ok: true; photos: PhotoRef[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { ok: false, error: "The photo list couldn't be read. Reload the page and try again." };
  }
  if (!Array.isArray(data)) return { ok: false, error: "The photo list couldn't be read. Reload the page and try again." };
  const seen = new Set<string>();
  const photos: PhotoRef[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string" || !item.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const alt = "alt" in item && typeof item.alt === "string" ? item.alt.trim().slice(0, LIMITS.alt) : "";
    photos.push({ id: item.id, alt: alt || null });
  }
  if (photos.length > max) return { ok: false, error: `A ${noun} can have up to ${max} photo${max === 1 ? "" : "s"}.` };
  return { ok: true, photos };
}

const RESERVED = new Set<string>(RESERVED_PRODUCT_SLUGS);

/**
 * Works out the final slug. `fallback` is the title / name it is generated from.
 * Auto-generated slugs get -2, -3… on a clash; a slug typed on purpose that clashes is an error.
 * `findTaken(prefix)` returns existing slugs that start with `prefix` (excluding the item being saved).
 */
export async function resolveSlug(options: {
  fd: FormData;
  fallback: string;
  noun: string;
  findTaken: (prefix: string) => Promise<string[]>;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const { fd, fallback, noun, findTaken } = options;
  const typed = slugify(String(fd.get("slug") ?? ""));
  const auto = !typed || fd.get("slugAuto") === "1";
  const base = typed || slugify(fallback);
  if (!base) return { ok: false, error: "Add a web address (slug) using letters or numbers. The title has none to build one from." };

  const taken = new Set(await findTaken(base));
  const isTaken = (s: string) => taken.has(s) || RESERVED.has(s);
  if (!isTaken(base)) return { ok: true, slug: base };
  if (!auto) {
    return {
      ok: false,
      error: RESERVED.has(base)
        ? `"${base}" is reserved by the website. Choose a different web address.`
        : `Another ${noun} already uses the web address "${base}". Choose a different one.`,
    };
  }
  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`;
    if (!isTaken(candidate)) return { ok: true, slug: candidate };
  }
  return { ok: false, error: "Couldn't find a free web address. Type one in the web address field." };
}
