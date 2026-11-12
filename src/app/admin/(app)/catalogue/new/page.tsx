import type { Metadata } from "next";
import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { ProductForm } from "@/components/crm/catalogue/ProductForm";
import { EmptyState, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { saveCatalogueProduct } from "../actions";
import { categoryOptions, loadCategoryIndex, one } from "../data";

export const metadata: Metadata = { title: "New product" };

export default async function NewCatalogueProductPage(props: PageProps<"/admin/catalogue/new">) {
  await requirePageAccess("website");
  const sp = await props.searchParams;
  const index = await loadCategoryIndex();
  const categories = categoryOptions(index);
  const preselected = index.byId.has(one(sp.category)) ? one(sp.category) : "";

  return (
    <>
      <CatalogueTabs active="products" />
      <PageHeader
        title="New product"
        subtitle="Add a product to the website catalogue."
        back={{ href: "/admin/catalogue", label: "Products" }}
      />
      {categories.length === 0 ? (
        <Panel flush>
          <EmptyState
            title="Create a category first"
            body="Every product sits in a category (for example Preservation, then Anti-Corrosion under it). Create one, then come back to add the product."
            action={
              <Link href="/admin/catalogue/categories/new" className="btn btn-brand !min-h-[44px] !px-5 text-sm">
                <FolderPlus size={16} /> New category
              </Link>
            }
          />
        </Panel>
      ) : (
        <ProductForm action={saveCatalogueProduct} categories={categories} defaultCategoryId={preselected} />
      )}
    </>
  );
}
