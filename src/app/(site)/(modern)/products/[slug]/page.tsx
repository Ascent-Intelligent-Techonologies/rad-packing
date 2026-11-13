import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { QuoteSection } from "@/components/catalogue/QuoteSection";
import { RichText } from "@/components/catalogue/RichText";
import { OpenChatButton } from "@/components/OpenChatButton";
import { PageHero } from "@/components/PageHero";
import { WhatsAppIcon } from "@/components/Icon";
import { getCatalogueIndexForSeo, getProduct } from "@/lib/catalogue/public";
import { categoryHref, imageSrc, productHref } from "@/lib/catalogue/shared";
import { site } from "@/lib/site";

/** A product / category page needs its data to render, so navigating to it may wait for the server (the data itself is cached). */
export const instant = false;

export async function generateStaticParams() {
  const { products } = await getCatalogueIndexForSeo();
  // at least one entry is required; an unknown slug renders the 404 page
  return products.length ? products.slice(0, 200).map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const cover = product.images[0];
  const description = product.summary ?? `${product.title} from RAD Packing Solutions, ${site.location}.`;
  return {
    title: product.title,
    description,
    alternates: { canonical: productHref(product.slug) },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      ...(cover ? { images: [{ url: imageSrc(cover.id), width: cover.width, height: cover.height, alt: cover.alt ?? product.title }] } : {}),
    },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const { category, chain } = product;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary ?? product.description?.slice(0, 300) ?? undefined,
    category: chain.map((c) => c.name).join(" > "),
    url: `${site.url}${productHref(product.slug)}`,
    brand: { "@type": "Brand", name: site.name },
    ...(product.images.length ? { image: product.images.map((i) => `${site.url}${imageSrc(i.id)}`) } : {}),
  };

  return (
    <>
      <PageHero
        compact
        eyebrow={category.name}
        title={product.title}
        top={
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              ...chain.map((c) => ({ label: c.name, href: categoryHref(c.path) })),
              { label: product.title },
            ]}
          />
        }
      >
        {product.summary && <p>{product.summary}</p>}
      </PageHero>

      <section className="section !pt-8">
        <div className="container-x">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
            <ProductGallery images={product.images} title={product.title} icon={category.icon} slug={product.slug} tags={product.tags} />

            <div className="min-w-0">
              {product.highlights.length > 0 && (
                <>
                  <h2 className="font-display text-xl font-bold sm:text-2xl">Key features</h2>
                  <ul className="mt-4 grid gap-3">
                    {product.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold ring-1 ring-line">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                          <Check size={13} strokeWidth={3} />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#quote" className="btn btn-accent">
                  Request a quote <ArrowRight size={18} />
                </a>
                <OpenChatButton prompt={`Tell me about ${product.title}`} className="btn btn-outline" />
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href={`tel:${site.phones[0].tel}`} className="btn btn-outline !min-h-[44px] !px-5 text-sm">
                  <Phone size={16} /> {site.phones[0].label}
                </a>
                <a
                  href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hello RAD Packing, I'd like to know more about ${product.title}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn !min-h-[44px] !px-5 bg-[#25D366] text-sm text-[#05301a]"
                >
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {(product.description || product.specs.length > 0) && (
            <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
              {product.description && (
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold">Description</h2>
                  <RichText text={product.description} className="mt-4" />
                </div>
              )}
              {product.specs.length > 0 && (
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold">Specifications</h2>
                  <dl className="card mt-4 divide-y divide-line overflow-hidden">
                    {product.specs.map((s) => (
                      <div key={s.label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[40%_1fr] sm:gap-4">
                        <dt className="text-sm font-bold text-muted">{s.label}</dt>
                        <dd className="break-words text-[15px] font-semibold">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-muted">Tags</span>
              {product.tags.map((t) => (
                <Link
                  key={t}
                  href={`/products?q=${encodeURIComponent(t)}`}
                  className="inline-flex min-h-[36px] items-center rounded-full bg-white px-3.5 text-sm font-semibold ring-1 ring-line transition hover:ring-brand/50"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          {product.related.length > 0 && (
            <section aria-label="Related products" className="mt-16">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold">More in {category.name}</h2>
                <Link href={categoryHref(category.path)} className="text-sm font-bold text-brand hover:underline">
                  View all
                </Link>
              </div>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {product.related.map((p) => (
                  <li key={p.id}>
                    <ProductCard p={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <QuoteSection
        heading="Interested in this product?"
        intro="Tell us the quantity, sizes and where it is going, and our team will come back with the right specification and a quotation."
        defaultMessage={`I'd like a quote for: ${product.title}\n`}
        defaultInterest={chain[0]?.slug}
      />

      {/* JSON-LD built from our own data; "<" is escaped so nothing in it can close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
