import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueBrowser, CatalogueSkeleton } from "@/components/catalogue/CatalogueBrowser";
import { QuoteSection } from "@/components/catalogue/QuoteSection";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Products & Solutions",
  description:
    "Browse RAD Packing Solutions' catalogue: preservation packing, anti-corrosion and anti-humidity materials, nail-less collapsible boxes, wooden and traditional packaging, and turnkey industrial packing contracting.",
  alternates: { canonical: "/products" },
};

export default function Products(props: PageProps<"/products">) {
  return (
    <>
      <PageHero
        eyebrow="Our products & solutions"
        title={
          <>
            Industrial-grade protection, <span className="text-gradient">fit for purpose.</span>
          </>
        }
      >
        <p>
          From high-barrier films and corrosion inhibitors to moisture-control systems and customized protective
          packaging, we deliver solutions that safeguard product integrity throughout storage, handling and
          transportation.
        </p>
      </PageHero>

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
