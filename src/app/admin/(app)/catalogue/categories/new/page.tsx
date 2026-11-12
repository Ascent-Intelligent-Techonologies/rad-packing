import type { Metadata } from "next";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { CategoryForm } from "@/components/crm/catalogue/CategoryForm";
import { PageHeader } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { categoryOptions, loadCategoryIndex, one } from "../../data";
import { saveCatalogueCategory } from "../actions";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage(props: PageProps<"/admin/catalogue/categories/new">) {
  await requirePageAccess("website");
  const sp = await props.searchParams;
  const index = await loadCategoryIndex();
  const parents = categoryOptions(index, { id: null });
  // ?parent=<id> comes from "Add sub-category"; ignore it when that spot no longer exists or is too deep
  const parent = parents.find((p) => p.id === one(sp.parent));

  return (
    <>
      <CatalogueTabs active="categories" />
      <PageHeader
        title={parent ? "New sub-category" : "New category"}
        subtitle={parent ? `It will sit under ${parent.name}.` : "A main category such as Preservation or Packaging."}
        back={{ href: "/admin/catalogue/categories", label: "Categories" }}
      />
      <CategoryForm action={saveCatalogueCategory} parents={parents} defaultParentId={parent?.id ?? ""} />
    </>
  );
}
