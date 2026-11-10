import Link from "next/link";
import { Package, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { Badge, EmptyState, PageHeader, Panel, TableWrap } from "@/components/crm/ui";
import { requireUser } from "@/lib/crm/auth";
import { PRODUCT_LINES } from "@/lib/crm/constants";
import { aed } from "@/lib/crm/format";
import { can } from "@/lib/crm/permissions";
import { getDb } from "@/lib/db";
import { deleteProduct, seedProductLines, toggleProduct } from "./actions";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Price list" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || "";

function SeedLines() {
  return (
    <ActionForm action={seedProductLines}>
      <SubmitButton className="btn btn-outline !min-h-[42px] !px-4 text-sm" pendingLabel="Adding…">
        <Package size={16} /> Add the five product lines
      </SubmitButton>
    </ActionForm>
  );
}

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  const user = await requireUser("view");
  const sp = await props.searchParams;
  const q = first(sp.q);
  const category = first(sp.category);
  const status = first(sp.status) === "inactive" ? "inactive" : first(sp.status) === "active" ? "active" : "";
  const editId = first(sp.edit);

  const canEdit = can(user.role, "catalogue");
  const canDelete = canEdit && can(user.role, "delete");
  const db = getDb()!;

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category === "none" ? { category: null } : category ? { category } : {}),
    ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
  };

  const [products, total, editing] = await Promise.all([
    db.product.findMany({ where, orderBy: [{ category: "asc" }, { name: "asc" }], take: 300 }),
    db.product.count(),
    canEdit && editId ? db.product.findUnique({ where: { id: editId } }) : null,
  ]);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, category, status, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };
  const filtered = Boolean(q || category || status);

  const chip = (active: boolean) =>
    `inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-brand bg-brand text-white" : "border-line bg-white text-text hover:border-brand/40"
    }`;

  return (
    <>
      <PageHeader
        title="Price list"
        subtitle={`${total} product${total === 1 ? "" : "s"} available to the quote builder.`}
      />

      {canEdit ? (
        <>
          {editing ? (
            <details open className="panel mb-6 overflow-hidden">
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-display text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <Pencil size={16} className="text-brand" /> Edit: {editing.name}
                </span>
                <Link href={href({ edit: undefined })} className="text-sm font-semibold text-brand hover:underline">
                  Close
                </Link>
              </summary>
              <div className="border-t border-line p-5">
                <ProductForm key={editing.id} product={editing} onDoneHref={href({ edit: undefined })} />
              </div>
            </details>
          ) : null}
          <details className="panel mb-6 overflow-hidden">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 px-5 py-3 font-display text-[15px] font-bold [&::-webkit-details-marker]:hidden">
              <Plus size={16} className="text-brand" /> Add a product
            </summary>
            <div className="space-y-5 border-t border-line p-5">
              <ProductForm />
              <div className="border-t border-line pt-4">
                <p className="mb-2 text-sm text-muted">
                  Or start from the five product lines on the website. They are added with a price of 0, so set the real prices afterwards.
                </p>
                <SeedLines />
              </div>
            </div>
          </details>
        </>
      ) : (
        <p className="mb-4 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand">
          You have read-only access to the price list. Managers and administrators can edit it.
        </p>
      )}

      <Panel flush>
        <div className="space-y-3 border-b border-line p-4">
          <form action="/admin/products" className="flex flex-col gap-2 sm:flex-row">
            {category && <input type="hidden" name="category" value={category} />}
            {status && <input type="hidden" name="status" value={status} />}
            <label className="relative block flex-1">
              <span className="sr-only">Search products</span>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={q} placeholder="Search name, SKU or description" className="field-sm !pl-10" />
            </label>
            <button className="btn btn-brand !min-h-[42px] !px-5 text-sm">Search</button>
          </form>
          <div className="flex flex-wrap gap-2" aria-label="Filter by category">
            <Link href={href({ category: undefined })} className={chip(!category)}>
              All categories
            </Link>
            {PRODUCT_LINES.map((l) => (
              <Link key={l.id} href={href({ category: l.id })} className={chip(category === l.id)}>
                {l.label}
              </Link>
            ))}
            <Link href={href({ category: "none" })} className={chip(category === "none")}>
              Uncategorised
            </Link>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter by status">
            <Link href={href({ status: undefined })} className={chip(!status)}>
              All
            </Link>
            <Link href={href({ status: "active" })} className={chip(status === "active")}>
              Active
            </Link>
            <Link href={href({ status: "inactive" })} className={chip(status === "inactive")}>
              Inactive
            </Link>
            {filtered && (
              <Link href="/admin/products" className="inline-flex min-h-[40px] items-center px-2 text-sm font-semibold text-brand hover:underline">
                Clear filters
              </Link>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title={filtered ? "No products match" : "The price list is empty"}
            body={
              filtered
                ? "Try a different search or clear the filters."
                : canEdit
                  ? 'Add products one by one, or use "Add the five product lines" to start from the services on the website.'
                  : "A manager can add products to the price list."
            }
            action={canEdit && !filtered ? <SeedLines /> : undefined}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th className="text-right">Unit price</th>
                <th>Status</th>
                {canEdit && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="min-w-[220px]">
                    <p className="font-semibold">{p.name}</p>
                    {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{p.description}</p>}
                  </td>
                  <td className="whitespace-nowrap text-muted">{p.sku ?? "–"}</td>
                  <td className="min-w-[160px] text-muted">{p.category ? (PRODUCT_LINES.find((l) => l.id === p.category)?.label ?? p.category) : "–"}</td>
                  <td className="whitespace-nowrap">{p.unit}</td>
                  <td className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {p.unitPriceFils === 0 ? <span className="font-medium text-muted">Not set</span> : aed(p.unitPriceFils)}
                  </td>
                  <td>{p.active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  {canEdit && (
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={href({ edit: p.id })}
                          aria-label={`Edit ${p.name}`}
                          title="Edit"
                          className="grid h-10 w-10 place-items-center rounded-xl border border-line text-text transition hover:border-brand hover:text-brand"
                        >
                          <Pencil size={16} />
                        </Link>
                        <form action={toggleProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            aria-label={p.active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                            title={p.active ? "Deactivate" : "Activate"}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-text transition hover:border-brand hover:text-brand"
                          >
                            <Power size={16} />
                          </button>
                        </form>
                        {canDelete && (
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton
                              message={`Delete "${p.name}" from the price list? Existing quotes keep their lines.`}
                              className="grid h-10 w-10 place-items-center rounded-xl border border-line text-red-600 transition hover:border-red-300 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              <span className="sr-only">Delete {p.name}</span>
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {products.length >= 300 && (
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Showing the first 300 matches. Narrow the search to see more.</p>
        )}
      </Panel>
    </>
  );
}
