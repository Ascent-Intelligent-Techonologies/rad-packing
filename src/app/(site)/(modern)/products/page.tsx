import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueBrowser, CatalogueSkeleton } from "@/components/catalogue/CatalogueBrowser";
import { CatalogueTop } from "@/components/catalogue/CatalogueTop";
import { QuoteSection } from "@/components/catalogue/QuoteSection";

export const metadata: Metadata = {
  title: "Products & Solutions",
  description:
    "Browse RAD Packing Solutions' catalogue: wooden pallets, industrial packaging, heat shrink wrapping, preservation and VCI packaging, and export packaging solutions.",
  alternates: { canonical: "/products" },
};

export default function Products(props: PageProps<"/products">) {
  return (
    <>
      <CatalogueTop title="Products & Solutions" />

      <section className="section !pt-8">
        <div className="container-x">
          <Suspense fallback={<CatalogueSkeleton />}>
            <CatalogueBrowser searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>

      <QuoteSection />
    </>
  );
}
