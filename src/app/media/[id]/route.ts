import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Serves a catalogue photo straight from the database.
 * `/media/<id>` is the full-size picture, `/media/<id>?s=thumb` the grid thumbnail.
 * An image row never changes after it is created (a replaced photo is a new row), so the
 * response can be cached forever by the browser and the CDN.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return notFound();
  const db = getDb();
  if (!db) return notFound();

  const wantThumb = req.nextUrl.searchParams.get("s") === "thumb";
  const row = await db.catalogImage.findUnique({ where: { id }, select: { mime: true } });
  if (!row) return notFound();
  const blob = wantThumb
    ? await db.catalogImageBlob.findUnique({ where: { imageId: id }, select: { thumb: true } })
    : await db.catalogImageBlob.findUnique({ where: { imageId: id }, select: { full: true } });
  const bytes = blob ? ("thumb" in blob ? blob.thumb : blob.full) : null;
  if (!bytes) return notFound();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
