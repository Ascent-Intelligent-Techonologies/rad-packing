import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, FolderPlus, LayoutGrid, Pencil, Plus } from "lucide-react";
import { CatalogueTabs } from "@/components/crm/catalogue/CatalogueTabs";
import { DeleteCategoryButton } from "@/components/crm/catalogue/DeleteCategoryButton";
import { Thumb } from "@/components/crm/catalogue/Thumb";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/crm/ui";
import { requirePageAccess } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { MAX_DEPTH } from "@/lib/catalogue/shared";
import { loadCategoryIndex } from "../data";
import { deleteCatalogueCategory, moveCatalogueCategory } from "./actions";

export const metadata: Metadata = { title: "Catalogue categories" };

const button = "btn btn-outline !min-h-[44px] !min-w-[44px] !px-3 text-sm md:!px-4";
const whenDisabled = "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:!border-line";
/** Visible on md and up; screen readers always get the text. */
const Label = ({ children }: { children: React.ReactNode }) => <span className="sr-only md:not-sr-only">{children}</span>;

export default async function CategoriesPage() {
  const user = await requirePageAccess("website");
  const canDelete = can(user.role, "delete");
  const index = await loadCategoryIndex();
  const tree = index.flatten();

  // products in the category and everything below it
  const withSubtree = (id: string) => index.subtreeIds(id).reduce((n, x) => n + (index.byId.get(x)?.products ?? 0), 0);

  return (
    <>
      <CatalogueTabs active="categories" />
      <PageHeader
        title="Categories"
        subtitle="The structure visitors browse: category, then sub-category, then product."
        actions={
          <Link href="/admin/catalogue/categories/new" className="btn btn-brand !min-h-[44px] !px-5 text-sm">
            <Plus size={16} /> New top-level category
          </Link>
        }
      />

      <Panel flush>
        {tree.length === 0 ? (
          <EmptyState
            title="No categories yet"
            body="Start with a main category such as Preservation or Packaging. You can add sub-categories under it afterwards."
            action={
              <Link href="/admin/catalogue/categories/new" className="btn btn-brand !min-h-[44px] !px-5 text-sm">
                <FolderPlus size={16} /> Create the first category
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {tree.map(({ cat, depth }) => {
              const siblings = index.childrenOf(cat.parentId);
              const position = siblings.findIndex((s) => s.id === cat.id);
              const subCount = index.childrenOf(cat.id).length;
              const total = withSubtree(cat.id);
              const canNest = depth + 1 < MAX_DEPTH;
              return (
                <li key={cat.id} className="py-3.5 pr-4" style={{ paddingLeft: `${16 + depth * 20}px` }}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumb imageId={cat.cover} icon={cat.icon} size={48} />
                      <div className="min-w-0">
                        <Link href={`/admin/catalogue/categories/${cat.id}`} className="block font-bold leading-snug text-brand hover:underline">
                          {cat.name}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span>
                            {cat.products} product{cat.products === 1 ? "" : "s"}
                            {subCount > 0 && total !== cat.products ? ` (${total} with sub-categories)` : ""}
                          </span>
                          {subCount > 0 && (
                            <span>
                              {subCount} sub-categor{subCount === 1 ? "y" : "ies"}
                            </span>
                          )}
                          {cat.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/catalogue/categories/${cat.id}`} aria-label={`Edit ${cat.name}`} className={button}>
                        <Pencil size={16} aria-hidden="true" />
                        <Label>Edit</Label>
                      </Link>
                      <Link href={`/admin/catalogue?category=${cat.id}`} aria-label={`Products in ${cat.name}`} className={button}>
                        <LayoutGrid size={16} aria-hidden="true" />
                        <Label>Products</Label>
                      </Link>
                      {canNest ? (
                        <Link href={`/admin/catalogue/categories/new?parent=${cat.id}`} aria-label={`Add sub-category under ${cat.name}`} className={button}>
                          <FolderPlus size={16} aria-hidden="true" />
                          <Label>Add sub-category</Label>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label={`Add sub-category under ${cat.name} (not available: ${MAX_DEPTH} levels is the deepest)`}
                          title={`Categories can be nested ${MAX_DEPTH} levels deep`}
                          className={`${button} ${whenDisabled}`}
                        >
                          <FolderPlus size={16} aria-hidden="true" />
                          <Label>Add sub-category</Label>
                        </button>
                      )}
                      {(["up", "down"] as const).map((dir) => {
                        const blocked = dir === "up" ? position <= 0 : position >= siblings.length - 1;
                        return (
                          <form key={dir} action={moveCatalogueCategory}>
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="dir" value={dir} />
                            <button type="submit" disabled={blocked} aria-label={`Move ${cat.name} ${dir}`} title={`Move ${dir}`} className={`${button} ${whenDisabled}`}>
                              {dir === "up" ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
                            </button>
                          </form>
                        );
                      })}
                      {canDelete && (
                        <DeleteCategoryButton
                          id={cat.id}
                          name={cat.name}
                          action={deleteCatalogueCategory}
                          label={null}
                          className={`${button} !text-red-600 hover:!border-red-300`}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
