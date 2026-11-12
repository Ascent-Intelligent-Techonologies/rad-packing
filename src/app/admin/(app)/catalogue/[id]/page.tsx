import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { ProductForm } from "@/components/crm/catalogue/ProductForm";
import { ConfirmButton } from "@/components/crm/forms";
import { Badge, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { fmtDateTime } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { productHref, readSpecs, specsToText } from "@/lib/catalogue/shared";
import { getDb } from "@/lib/db";
import { deleteCatalogueProduct, saveCatalogueProduct } from "../actions";
import { categoryOptions, loadCategoryIndex, one } from "../data";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditCatalogueProductPage(props: PageProps<"/admin/catalogue/[id]">) {
  const user = await requirePageAccess("website");
  const { id } = await props.params;
  const sp = await props.searchParams;

  const [product, index] = await Promise.all([
    getDb()!.catalogProduct.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" }, select: { id: true, alt: true } } },
    }),
    loadCategoryIndex(),
  ]);
  if (!product) notFound();

  const canDelete = can(user.role, "delete");

  return (
    <>
      <CatalogueTabs active="products" />
      <PageHeader
        title={product.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {product.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
            <span>Last updated {fmtDateTime(product.updatedAt)}</span>
          </span>
        }
        back={{ href: "/admin/catalogue", label: "Products" }}
        actions={
          product.published ? (
            <Link href={productHref(product.slug)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-[44px] !px-4 text-sm">
              View on website <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          ) : undefined
        }
      />

      {one(sp.saved) === "1" && (
        <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          {product.published ? "Product added. It is live on the website." : "Product added as a draft. Tick Published to show it on the website."}
        </p>
      )}

      <ProductForm
        key={product.id}
        action={saveCatalogueProduct}
        categories={categoryOptions(index)}
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          categoryId: product.categoryId,
          summary: product.summary ?? "",
          description: product.description ?? "",
          highlights: product.highlights.join("\n"),
          specs: specsToText(readSpecs(product.specs)),
          tags: product.tags.join(", "),
          published: product.published,
          featured: product.featured,
          images: product.images.map((i) => ({ id: i.id, alt: i.alt ?? "" })),
        }}
      />

      {canDelete && (
        <Panel title="Delete this product" className="mt-5">
          <form action={deleteCatalogueProduct} className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted">
              Removes the product and its photos from the website for good. To hide it without deleting, untick Published and save.
            </p>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton
              message={`Delete "${product.title}" and its photos? This cannot be undone.`}
              className="btn btn-outline !min-h-[44px] !px-4 text-sm !text-red-600 hover:!border-red-300"
            >
              <Trash2 size={16} aria-hidden="true" /> Delete product
            </ConfirmButton>
          </form>
        </Panel>
      )}
    </>
  );
}
