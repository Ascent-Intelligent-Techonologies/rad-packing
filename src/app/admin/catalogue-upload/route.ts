import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { IMAGE, LIMITS, imageSrc } from "@/lib/catalogue/shared";
import { sniffImage } from "@/lib/catalogue/images";

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const int = (v: FormDataEntryValue | null, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

/**
 * Upload one catalogue photo (admin only).
 *
 * multipart/form-data:
 *   full   – the picture, already resized in the browser (jpeg | png | webp)
 *   thumb  – a small version for grids, same format
 *   width, height – pixel size of `full`
 *   alt    – optional description
 *
 * The photo is stored unattached; it becomes part of a product or category when that form is saved.
 * Unattached photos older than a day are deleted here, so abandoned uploads clean themselves up.
 */
export async function POST(req: NextRequest) {
  // Reading the session cookie makes this run per request, never prerendered.
  const user = await getCurrentUser();
  if (!user) return json(401, { error: "Please sign in again." });
  if (!can(user.role, "website")) return json(403, { error: "You don't have permission to upload photos." });

  const db = getDb();
  if (!db) return json(503, { error: "The database is not configured." });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, { error: "Could not read the upload. The file may be too large." });
  }
  const full = form.get("full");
  const thumb = form.get("thumb");
  if (!(full instanceof File) || !(thumb instanceof File)) return json(400, { error: "Choose an image to upload." });
  if (full.size === 0 || full.size > IMAGE.maxFullBytes) {
    return json(413, { error: `That picture is too large (max ${(IMAGE.maxFullBytes / 1_000_000).toFixed(1)} MB after resizing).` });
  }
  if (thumb.size === 0 || thumb.size > IMAGE.maxThumbBytes) return json(413, { error: "The thumbnail is too large." });

  const fullBytes = new Uint8Array(await full.arrayBuffer());
  const thumbBytes = new Uint8Array(await thumb.arrayBuffer());
  const mime = sniffImage(fullBytes);
  if (!mime || sniffImage(thumbBytes) !== mime) return json(415, { error: "Only JPEG, PNG or WebP pictures are accepted." });

  const alt = String(form.get("alt") ?? "").trim().slice(0, LIMITS.alt) || null;
  const width = int(form.get("width"), 1, 8000);
  const height = int(form.get("height"), 1, 8000);

  // abandoned uploads (never attached to a product or category)
  await db.catalogImage.deleteMany({
    where: { productId: null, categoryId: null, createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } },
  });

  const image = await db.catalogImage.create({
    data: { mime, width, height, bytes: fullBytes.byteLength, alt, blob: { create: { full: fullBytes, thumb: thumbBytes } } },
    select: { id: true },
  });

  return json(201, {
    id: image.id,
    width,
    height,
    alt,
    url: imageSrc(image.id),
    thumbUrl: imageSrc(image.id, "thumb"),
  });
}
