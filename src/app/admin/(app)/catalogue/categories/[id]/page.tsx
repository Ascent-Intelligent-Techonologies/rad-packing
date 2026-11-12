import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { CategoryForm } from "@/components/crm/catalogue/CategoryForm";
import { DeleteCategoryButton } from "@/components/crm/catalogue/DeleteCategoryButton";
import { Badge, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { categoryHref } from "@/lib/catalogue/shared";
import { getDb } from "@/lib/db";
import { categoryOptions, loadCategoryIndex, one } from "../../data";
import { deleteCatalogueCategory, saveCatalogueCategory } from "../actions";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage(props: PageProps<"/admin/catalogue/categories/[id]">) {
  const user = await requirePageAccess("website");
  const { id } = await props.params;
  const sp = await props.searchParams;

  const [index, detail] = await Promise.all([
    loadCategoryIndex(),
    getDb()!.catalogCategory.findUnique({
      where: { id },
      select: { description: true, images: { orderBy: { position: "asc" }, take: 1, select: { id: true, alt: true } } },
    }),
  ]);
  const category = index.byId.get(id);
  if (!category || !detail) notFound();
  const image = detail.images[0];

  const subCategories = index.childrenOf(id).length;
  const productsHere = category.products;
  const productsInTree = index.subtreeIds(id).reduce((n, x) => n + (index.byId.get(x)?.products ?? 0), 0);
  const publicPath = categoryHref(index.chain(id).map((c) => c.slug));

  return (
    <>
      <CatalogueTabs active="categories" />
      <PageHeader
        title={category.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {category.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
            <span>{index.chain(id).map((c) => c.name).join(" › ")}</span>
          </span>
        }
        back={{ href: "/admin/catalogue/categories", label: "Categories" }}
        actions={
          category.published ? (
            <Link href={publicPath} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-[44px] !px-4 text-sm">
              View on website <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          ) : undefined
        }
      />

      {one(sp.saved) === "1" && (
        <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          Category added.
        </p>
      )}

      <dl className="panel mb-5 grid gap-4 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Sub-categories</dt>
          <dd className="mt-1 font-display text-xl font-extrabold">{subCategories}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Products</dt>
          <dd className="mt-1 font-display text-xl font-extrabold">
            {productsHere}
            {productsInTree !== productsHere && <span className="ml-2 text-sm font-medium text-muted">({productsInTree} with sub-categories)</span>}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Web address</dt>
          <dd className="mt-1 break-all text-sm font-semibold">{publicPath}</dd>
        </div>
      </dl>

      <CategoryForm
        key={category.id}
        action={saveCatalogueCategory}
        parents={categoryOptions(index, { id })}
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ?? "",
          summary: category.summary ?? "",
          description: detail.description ?? "",
          icon: category.icon ?? "",
          published: category.published,
          image: image ? { id: image.id, alt: image.alt ?? "" } : null,
        }}
      />

      {can(user.role, "delete") && (
        <Panel title="Delete this category" className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted">
              Only an empty category can be deleted. Move or delete its sub-categories and products first, or untick Published to hide it instead.
            </p>
            <DeleteCategoryButton
              id={category.id}
              name={category.name}
              action={deleteCatalogueCategory}
              label="Delete category"
              className="btn btn-outline !min-h-[44px] !px-4 text-sm !text-red-600 hover:!border-red-300"
            />
          </div>
        </Panel>
      )}
    </>
  );
}
