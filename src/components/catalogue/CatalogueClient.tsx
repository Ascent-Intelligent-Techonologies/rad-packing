"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Search, SearchX, X } from "lucide-react";
import { OpenChatButton } from "@/components/OpenChatButton";
import type { ProductPage, PublicCategory } from "@/lib/catalogue/public";
import { catalogueUrl, isPlainClick, parseCatalogueLocation, type CatalogueView } from "@/lib/catalogue/shared";
import { site } from "@/lib/site";
import { CatalogueSidebar } from "./CatalogueSidebar";
import { CategoryTile } from "./CategoryTile";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

const keyOf = (v: CatalogueView) => `${v.categoryPath}|${v.q}|${v.page}`;
const SEARCH_DELAY_MS = 300;

/**
 * Interactive catalogue. The address bar is the source of truth (category, search and page live in
 * the URL, so views can be shared and Back works), but changing any of them only swaps the product
 * area: no page reload and no jump to the top.
 */
export function CatalogueClient({
  categories,
  initialView,
  initialResult,
}: {
  categories: PublicCategory[];
  initialView: CatalogueView;
  initialResult: ProductPage;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseCatalogueLocation(pathname, searchParams.toString()) ?? initialView;
  const key = keyOf(view);

  // ── results for the current view ──
  const [data, setData] = useState({ key: keyOf(initialView), result: initialResult });
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const failed = failedKey === key;
  const loading = data.key !== key && !failed;

  useEffect(() => {
    if (data.key === key || failedKey === key) return;
    const ac = new AbortController();
    const params = new URLSearchParams();
    if (view.categoryPath) params.set("category", view.categoryPath);
    if (view.q) params.set("q", view.q);
    if (view.page > 1) params.set("page", String(view.page));
    fetch(`/api/catalogue?${params}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`catalogue ${r.status}`);
        return (await r.json()) as ProductPage;
      })
      .then((result) => setData({ key, result }))
      .catch(() => {
        if (!ac.signal.aborted) setFailedKey(key);
      });
    return () => ac.abort();
  }, [key, data.key, failedKey, attempt, view.categoryPath, view.q, view.page]);

  // ── moving between views ──
  const resultsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  /** Bring `el` to the top only when the visitor has scrolled past it (or it is below the screen). */
  const reveal = (el: HTMLElement | null) => {
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    if (top < 96 || top > window.innerHeight * 0.75) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Scrolling waits until the new view is on screen: the heading above the catalogue can change
  // height with the category, which would otherwise leave us a few lines off.
  const pendingReveal = useRef<"top" | "results" | null>(null);
  useEffect(() => {
    const where = pendingReveal.current;
    pendingReveal.current = null;
    if (where) reveal(where === "top" ? topRef.current : resultsRef.current);
  }, [key]);

  const go = (next: CatalogueView, opts: { replace?: boolean; reveal?: "top" | "results" | "none" } = {}) => {
    const url = catalogueUrl(next);
    if (url === window.location.pathname + window.location.search) return;
    const where = opts.reveal ?? "top";
    pendingReveal.current = where === "none" ? null : where;
    setFailedKey(null);
    if (opts.replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };

  // ── search box ──
  const [term, setTerm] = useState(view.q);
  const [seenQ, setSeenQ] = useState(view.q); //   the URL's search term we last reconciled with
  const [ownQ, setOwnQ] = useState(view.q); //     the search term we last put in the URL ourselves
  if (view.q !== seenQ) {
    setSeenQ(view.q);
    if (view.q !== ownQ) {
      // changed from outside (Back / Forward, a link): show it in the box
      setTerm(view.q);
      setOwnQ(view.q);
    }
  }

  const commitSearch = (text: string, opts: { replace?: boolean; reveal?: "results" | "none"; categoryPath?: string } = {}) => {
    const q = text.trim().slice(0, 80);
    const categoryPath = opts.categoryPath ?? view.categoryPath;
    if (q === view.q && categoryPath === view.categoryPath) return;
    setOwnQ(q);
    go({ categoryPath, q, page: 1 }, { replace: opts.replace, reveal: opts.reveal ?? "none" });
  };

  // results as you type
  const commitRef = useRef(commitSearch);
  useEffect(() => {
    commitRef.current = commitSearch;
  });
  useEffect(() => {
    const t = window.setTimeout(() => commitRef.current(term, { replace: true }), SEARCH_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [term]);

  // ── what is on screen ──
  const current = view.categoryPath ? categories.find((c) => c.path.join("/") === view.categoryPath) : undefined;
  const trail = current
    ? current.path.map((_, i) => categories.find((c) => c.path.join("/") === current.path.slice(0, i + 1).join("/"))).filter((c) => !!c)
    : [];
  const tiles = categories.filter((c) => (current ? c.parentId === current.id : c.parentId === null));
  const totalAll = categories.filter((c) => c.parentId === null).reduce((n, c) => n + c.total, 0);
  const { result } = data;
  const showTiles = !view.q && view.page === 1 && tiles.length > 0;

  // keep the tab title in step with in-place changes (the server only sets it on a full load)
  const title = `${current ? current.name : "Products & Solutions"} | ${site.name}`;
  const firstTitle = useRef(true);
  useEffect(() => {
    if (firstTitle.current) {
      firstTitle.current = false;
      return;
    }
    document.title = title;
  }, [title]);

  const selectCategory = (path: string[] | null) => go({ categoryPath: path ? path.join("/") : "", q: view.q, page: 1 });
  const inPlace = (e: React.MouseEvent, next: CatalogueView) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    go(next);
  };
  const clearSearch = () => {
    setTerm("");
    commitSearch("", { reveal: "none" });
  };

  const heading = view.q ? `Results for “${view.q}”` : current ? `${current.name} products` : "All products";

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="Catalogue navigation">
        <CatalogueSidebar categories={categories} activeId={current?.id} total={totalAll} onSelect={selectCategory} />
      </aside>

      <div ref={topRef} className="min-w-0 scroll-mt-28">
        <form
          role="search"
          action={catalogueUrl({ categoryPath: view.categoryPath, q: "", page: 1 })}
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            commitSearch(term, { reveal: "results" });
          }}
          className="flex gap-2"
        >
          <label htmlFor="catalogue-q" className="sr-only">
            Search {current ? current.name : "all products"}
          </label>
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="catalogue-q"
              name="q"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              maxLength={80}
              autoComplete="off"
              placeholder={current ? `Search in ${current.name}…` : "Search products, e.g. desiccant, VCI film, pallets…"}
              className="field !pl-11 !pr-12"
            />
            {term && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-brand !px-6">
            Search
          </button>
        </form>

        {current && (
          <nav aria-label="Selected category" className="mt-5">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold text-muted">
              <li>
                <Link
                  href={catalogueUrl({ categoryPath: "", q: view.q, page: 1 })}
                  prefetch={false}
                  onClick={(e) => inPlace(e, { categoryPath: "", q: view.q, page: 1 })}
                  className="hover:text-brand hover:underline"
                >
                  All products
                </Link>
              </li>
              {trail.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1.5">
                  <ChevronRight size={14} className="text-muted/60" aria-hidden="true" />
                  {i === trail.length - 1 ? (
                    <span aria-current="true" className="text-text">
                      {c.name}
                    </span>
                  ) : (
                    <Link
                      href={catalogueUrl({ categoryPath: c.path.join("/"), q: view.q, page: 1 })}
                      prefetch={false}
                      onClick={(e) => inPlace(e, { categoryPath: c.path.join("/"), q: view.q, page: 1 })}
                      className="hover:text-brand hover:underline"
                    >
                      {c.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {showTiles && (
          <section aria-label={current ? "Sub-categories" : "Browse by category"} className="mt-8">
            <h2 className="font-display text-xl font-bold sm:text-2xl">{current ? "Sub-categories" : "Browse by category"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {tiles.map((c) => (
                <CategoryTile key={c.id} c={c} onSelect={selectCategory} />
              ))}
            </div>
          </section>
        )}

        <section aria-label="Products" aria-busy={loading} className="mt-10">
          <div ref={resultsRef} className="flex scroll-mt-28 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold sm:text-2xl">{heading}</h2>
              {view.q && current && <p className="mt-1 text-sm font-semibold text-muted">in {current.name}</p>}
              {!view.q && current?.summary && <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-muted">{current.summary}</p>}
            </div>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted" role="status" aria-live="polite">
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Loading…
                </>
              ) : failed ? null : (
                <>
                  {result.total} {result.total === 1 ? "product" : "products"}
                  {result.pages > 1 && ` · page ${result.page} of ${result.pages}`}
                </>
              )}
            </p>
          </div>

          {view.q && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-50 px-4 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              <X size={15} /> Clear search
            </button>
          )}

          {failed ? (
            <div role="alert" className="card mt-6 grid place-items-center px-6 py-12 text-center">
              <h3 className="font-display text-xl font-bold">We couldn&apos;t load the products</h3>
              <p className="mt-2 max-w-md text-muted">Please check your connection and try again.</p>
              <button
                type="button"
                onClick={() => {
                  setFailedKey(null);
                  setAttempt((n) => n + 1);
                }}
                className="btn btn-brand mt-6"
              >
                Try again
              </button>
            </div>
          ) : result.items.length === 0 && !loading ? (
            <div className="card mt-6 grid place-items-center px-6 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand">
                <SearchX size={26} />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold">
                {view.q ? `No products match “${view.q}”${current ? ` in ${current.name}` : ""}` : "No products here yet"}
              </h3>
              <p className="mt-2 max-w-md text-muted">
                {view.q
                  ? "Try a different word, or ask our assistant. We can often supply items that are not listed."
                  : "We are adding products to this section. Tell us what you need and we will advise."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {view.q && current && (result.alsoInAll ?? 0) > 0 && (
                  <button type="button" onClick={() => commitSearch(view.q, { categoryPath: "", reveal: "results" })} className="btn btn-brand">
                    Show {result.alsoInAll} {result.alsoInAll === 1 ? "match" : "matches"} in all products
                  </button>
                )}
                {view.q && (
                  <button type="button" onClick={clearSearch} className="btn btn-outline">
                    Clear search
                  </button>
                )}
                <OpenChatButton prompt="I need a tailored solution" className="btn btn-outline" />
              </div>
            </div>
          ) : (
            <ul className={`mt-6 grid gap-5 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-50" : ""}`}>
              {result.items.map((p, i) => (
                <li key={p.id}>
                  <ProductCard p={p} priority={i < 3} onCategory={selectCategory} />
                </li>
              ))}
            </ul>
          )}

          {!failed && (
            <Pagination
              page={Math.min(view.page, result.pages)}
              pages={result.pages}
              hrefFor={(n) => catalogueUrl({ ...view, page: n })}
              onPage={(n) => go({ ...view, page: n }, { reveal: "results" })}
            />
          )}
        </section>
      </div>
    </div>
  );
}
