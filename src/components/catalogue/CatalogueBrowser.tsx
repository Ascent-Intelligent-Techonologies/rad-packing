import { getCategories, searchCatalogue } from "@/lib/catalogue/public";
import { OpenChatButton } from "@/components/OpenChatButton";
import { CatalogueClient } from "./CatalogueClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

/**
 * The browsable catalogue: category hierarchy on the left, search + sub-category tiles + a paged
 * product grid on the right. Used by /products and by every category page.
 *
 * The server renders the first view (so the page works without JavaScript and is indexable); after
 * that <CatalogueClient> switches category, searches and pages in place without reloading the page.
 * Reads the query string, so render it inside <Suspense>.
 */
export async function CatalogueBrowser({
  searchParams,
  categoryPath = "",
}: {
  searchParams: SearchParams;
  /** slugs joined with "/" when this is a category page */
  categoryPath?: string;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim().slice(0, 80);
  const page = Math.max(1, Math.min(1000, parseInt(first(sp.page), 10) || 1));

  const cats = await getCategories();
  if (cats.length === 0) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <h2 className="font-display text-2xl font-bold">Our catalogue is being updated</h2>
        <p className="mt-3 text-muted">Tell us what you need and our team will recommend the right solution.</p>
        <div className="mt-6 flex justify-center">
          <OpenChatButton prompt="I need a tailored solution" className="btn btn-brand" />
        </div>
      </div>
    );
  }

  const current = categoryPath ? cats.find((c) => c.path.join("/") === categoryPath) : undefined;
  const result = await searchCatalogue(current?.id ?? "", q, page);

  return (
    <CatalogueClient
      categories={cats}
      initialView={{ categoryPath: current ? categoryPath : "", q, page }}
      initialResult={result}
    />
  );
}

export function CatalogueSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10" aria-hidden="true">
      <div className="card hidden h-96 animate-pulse bg-white/60 lg:block" />
      <div>
        <div className="h-[52px] animate-pulse rounded-2xl bg-white/70" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-white/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
