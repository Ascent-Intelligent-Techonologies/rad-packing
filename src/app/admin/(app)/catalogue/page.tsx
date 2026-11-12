import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { BulkDelete } from "@/components/crm/BulkDelete";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { CategorySelect } from "@/components/crm/catalogue/CategorySelect";
import { catalogueCounts } from "@/components/crm/catalogue/counts";
import { Pager } from "@/components/crm/customers/Pager";
import { EmptyState, Field, PageHeader, Panel, StatCard } from "@/components/crm/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requirePageAccess } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";
import { bulkDeleteCatalogueProducts } from "./actions";
import { categoryOptions, categoryPath, isCategoryVisible, loadCategoryIndex, one } from "./data";
import { ProductRows } from "./ProductRows";

export const metadata: Metadata = { title: "Website catalogue" };

const PAGE_SIZE = 25;
const STATUSES = [
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
] as const;

export default async function CataloguePage(props: PageProps<"/admin/catalogue">) {
  const user = await requirePageAccess("website");
  const sp = await props.searchParams;
  const db = getDb()!;
  const canDelete = can(user.role, "delete");

  const [index, counts] = await Promise.all([loadCategoryIndex(), catalogueCounts()]);

  const q = one(sp.q).slice(0, 100);
  const category = index.byId.has(one(sp.category)) ? one(sp.category) : "";
  const status = STATUSES.find((s) => s.id === one(sp.status))?.id ?? "";
  const page = Math.max(1, Math.min(10_000, parseInt(one(sp.page), 10) || 1));

  const where: Prisma.CatalogProductWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { tags: { hasSome: [q, q.toLowerCase()] } },
            ],
          }
        : {},
      category ? { categoryId: { in: index.subtreeIds(category) } } : {},
      status === "published" ? { published: true } : status === "draft" ? { published: false } : {},
    ],
  };

  const [total, products] = await Promise.all([
    db.catalogProduct.count({ where }),
    db.catalogProduct.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        featured: true,
        updatedAt: true,
        categoryId: true,
        images: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    published: p.published,
    featured: p.featured,
    updatedAt: p.updatedAt,
    categoryPath: categoryPath(index, p.categoryId) || "–",
    hiddenByCategory: p.published && !isCategoryVisible(index, p.categoryId),
    coverId: p.images[0]?.id ?? null,
    icon: index.byId.get(p.categoryId)?.icon ?? null,
  }));

  const filtered = Boolean(q || category || status);
  const drafts = counts.products - counts.published;

  return (
    <>
      <CatalogueTabs active="products" />
      <PageHeader
        title="Website catalogue"
        subtitle={`${total} product${total === 1 ? "" : "s"}${filtered ? (total === 1 ? " matches your filters" : " match your filters") : " on the website catalogue"}. Changes go live as soon as you save.`}
        actions={
          <Link href={category ? `/admin/catalogue/new?category=${category}` : "/admin/catalogue/new"} className="btn btn-brand !min-h-[44px] !px-5 text-sm">
            <Plus size={16} /> New product
          </Link>
        }
      />

      <section aria-label="Catalogue totals" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Products" value={counts.products} href="/admin/catalogue" />
        <StatCard label="Published" value={counts.published} hint="Visible on the website" href="/admin/catalogue?status=published" />
        <StatCard label="Drafts" value={drafts} hint="Not visible yet" href="/admin/catalogue?status=draft" />
        <StatCard label="Categories" value={counts.categories} href="/admin/catalogue/categories" />
      </section>

      <form role="search" className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))_auto] lg:items-end">
        <Field label="Search" className="sm:col-span-2 lg:col-span-1">
          <input name="q" type="search" defaultValue={q} placeholder="Title, summary or tag…" className="field-sm" autoComplete="off" />
        </Field>
        <Field label="Category" hint={category ? "Includes its sub-categories." : undefined}>
          <CategorySelect name="category" defaultValue={category} options={categoryOptions(index)} placeholder="All categories" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={status} className="field-sm">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="btn btn-brand !min-h-[44px] !px-5 text-sm">
            <Search size={16} /> Apply
          </button>
          {filtered && (
            <Link href="/admin/catalogue" className="btn btn-outline !min-h-[44px] !px-4 text-sm">
              Clear
            </Link>
          )}
        </div>
      </form>

      {canDelete && rows.length > 0 && (
        <div className="mb-3 flex justify-end">
          <BulkDelete
            formId="bulk-catalogue"
            action={bulkDeleteCatalogueProducts}
            noun="product"
            nounPlural="products"
            warning="Their photos are deleted too, and they disappear from the website straight away."
          />
        </div>
      )}

      <Panel flush>
        {rows.length === 0 ? (
          <EmptyState
            title={filtered ? "No products match" : "No products yet"}
            body={
              filtered
                ? "Try a different search or clear the filters."
                : counts.categories === 0
                  ? "Create a category first, then add the products that belong in it."
                  : "Add a product with a title, description and photos and it appears on the website."
            }
            action={
              !filtered ? (
                <Link href="/admin/catalogue/new" className="btn btn-brand !min-h-[44px] !px-5 text-sm">
                  <Plus size={16} /> Add your first product
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <ProductRows rows={rows} canDelete={canDelete} />
            <Pager basePath="/admin/catalogue" params={{ q, category, status }} page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </Panel>
    </>
  );
}
