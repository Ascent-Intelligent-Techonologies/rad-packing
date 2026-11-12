import type { NextRequest } from "next/server";
import { getCategories, searchCatalogue } from "@/lib/catalogue/public";

/**
 * Product results for the catalogue page, so filtering and searching can update just the product
 * area without reloading the page.  GET /api/catalogue?category=a/b&q=film&page=2
 * Public data only (published products in published categories). Always fresh: the data behind it
 * is cached on the server and refreshed the moment staff save a change.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(1000, parseInt(sp.get("page") ?? "", 10) || 1));
  const categoryPath = (sp.get("category") ?? "").replace(/^\/+|\/+$/g, "").slice(0, 300);

  const cats = await getCategories();
  const category = categoryPath ? cats.find((c) => c.path.join("/") === categoryPath) : undefined;
  if (categoryPath && !category) {
    return Response.json({ error: "Unknown category." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const result = await searchCatalogue(category?.id ?? "", q, page);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
