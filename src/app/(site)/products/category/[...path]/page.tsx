import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HeroCrumbs, HeroEyebrow, HeroIntro, HeroTitle, type HeroCategory } from "@/components/catalogue/CategoryHero";
import { CatalogueBrowser, CatalogueSkeleton } from "@/components/catalogue/CatalogueBrowser";
import { QuoteSection } from "@/components/catalogue/QuoteSection";
import { PageHero } from "@/components/PageHero";
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

  // The hero text is rendered from this list by small client components, so it stays correct when
  // the visitor switches category in place (the catalogue below does that without reloading).
  const heroCategories: HeroCategory[] = (await getCategories()).map((c) => ({
    path: c.path,
    name: c.name,
    intro: c.description ?? c.summary,
  }));

  return (
    <>
      <PageHero
        compact
        top={<HeroCrumbs categories={heroCategories} />}
        eyebrow={<HeroEyebrow categories={heroCategories} />}
        title={<HeroTitle categories={heroCategories} />}
      >
        <HeroIntro categories={heroCategories} />
      </PageHero>

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
