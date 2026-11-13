import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogueBrowser, CatalogueSkeleton } from "@/components/catalogue/CatalogueBrowser";
import { CatalogueTop } from "@/components/catalogue/CatalogueTop";
import { CurrentCategoryCrumbData, CurrentCategoryTitle, type CategoryRef } from "@/components/catalogue/CurrentCategory";
import { QuoteSection } from "@/components/catalogue/QuoteSection";
import { getCategories, getCategoryByPath } from "@/lib/catalogue/public";
import { categoryHref } from "@/lib/catalogue/shared";

/** A product / category page needs its data to render, so navigating to it may wait for the server (the data itself is cached). */
export const instant = false;

export async function generateStaticParams() {
  const cats = await getCategories();
  // at least one entry is required; an unknown path renders the 404 page
  return cats.length ? cats.map((c) => ({ path: c.path })) : [{ path: ["_"] }];
}

export async function generateMetadata(props: PageProps<"/products/category/[...path]">): Promise<Metadata> {
  const { path } = await props.params;
  const found = await getCategoryByPath(path.join("/"));
  if (!found) return { title: "Category not found" };
  const { category } = found;
  return {
    title: category.name,
    description: category.summary ?? `Browse ${category.name} from RAD Packing Solutions.`,
    alternates: { canonical: categoryHref(category.path) },
  };
}

export default async function CategoryPage(props: PageProps<"/products/category/[...path]">) {
  const { path } = await props.params;
  const found = await getCategoryByPath(path.join("/"));
  if (!found) notFound();
  const { category } = found;

  // The title and breadcrumb data are rendered from this list by small client components, so they
  // stay correct when the visitor switches category in place (the catalogue does that without reloading).
  const all: CategoryRef[] = (await getCategories()).map((c) => ({ path: c.path, name: c.name }));

  return (
    <>
      <CatalogueTop title={<CurrentCategoryTitle categories={all} />}>
        <CurrentCategoryCrumbData categories={all} />
      </CatalogueTop>

      <section className="section !pt-8">
        <div className="container-x">
          <Suspense fallback={<CatalogueSkeleton />}>
            <CatalogueBrowser searchParams={props.searchParams} categoryPath={category.path.join("/")} />
          </Suspense>
        </div>
      </section>

      <QuoteSection defaultInterest={category.path[0]} />
    </>
  );
}
