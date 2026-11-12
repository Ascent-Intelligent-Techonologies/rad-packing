import Link from "next/link";
import { EyeOff, Globe, Pencil, Star } from "lucide-react";
import { RowCheck, SelectAll } from "@/components/crm/BulkDelete";
import { SubmitButton } from "@/components/crm/forms";
import { Thumb } from "@/components/crm/catalogue/Thumb";
import { Badge, TableWrap } from "@/components/crm/ui";
import { fmtDate } from "@/lib/crm/format";
import { productHref } from "@/lib/catalogue/shared";
import { toggleCataloguePublished } from "./actions";

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  featured: boolean;
  updatedAt: Date;
  categoryPath: string;
  /** published, but a category above it is a draft, so visitors still can't see it */
  hiddenByCategory: boolean;
  coverId: string | null;
  icon: string | null;
};

const BULK_FORM = "bulk-catalogue";

const iconButton =
  "grid h-10 w-10 place-items-center rounded-xl border border-line text-text transition hover:border-brand hover:text-brand";
const textButton = "btn btn-outline !min-h-[44px] !px-4 text-sm";

function StatusBadges({ row }: { row: ProductRow }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {row.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
      {row.hiddenByCategory && <Badge tone="amber">Category hidden</Badge>}
      {row.featured && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
          <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" /> Featured
        </span>
      )}
    </span>
  );
}

/** Edit, View and Publish/Unpublish. `labelled` = text buttons (phones), otherwise icon buttons (table). */
function RowActions({ row, labelled }: { row: ProductRow; labelled: boolean }) {
  const cls = labelled ? textButton : iconButton;
  const text = (t: string) => (labelled ? t : <span className="sr-only">{t}</span>);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${labelled ? "" : "justify-end"}`}>
      <Link href={`/admin/catalogue/${row.id}`} className={cls} title={labelled ? undefined : "Edit"}>
        <Pencil size={16} aria-hidden="true" /> {text(`Edit ${row.title}`)}
      </Link>
      {row.published && (
        <Link href={productHref(row.slug)} target="_blank" rel="noopener noreferrer" className={cls} title={labelled ? undefined : "View on the website"}>
          <Globe size={16} aria-hidden="true" /> {text(`View ${row.title} on the website (opens in a new tab)`)}
        </Link>
      )}
      <form action={toggleCataloguePublished}>
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="publish" value={row.published ? "0" : "1"} />
        <SubmitButton className={cls} pendingLabel={labelled ? "Saving…" : ""}>
          {row.published ? <EyeOff size={16} aria-hidden="true" /> : <Globe size={16} aria-hidden="true" />}{" "}
          {labelled ? (row.published ? "Unpublish" : "Publish") : <span className="sr-only">{row.published ? `Unpublish ${row.title}` : `Publish ${row.title}`}</span>}
        </SubmitButton>
      </form>
    </div>
  );
}

/** Product list: stacked cards on phones, a table from md up. */
export function ProductRows({ rows, canDelete }: { rows: ProductRow[]; canDelete: boolean }) {
  return (
    <>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex items-stretch">
            {canDelete && (
              <label className="grid w-11 shrink-0 cursor-pointer place-items-center">
                <RowCheck formId={BULK_FORM} id={r.id} label={`Select ${r.title}`} />
              </label>
            )}
            <div className={`min-w-0 flex-1 space-y-3 py-3.5 pr-4 ${canDelete ? "pl-0" : "pl-4"}`}>
              <div className="flex gap-3">
                <Thumb imageId={r.coverId} icon={r.icon} />
                <div className="min-w-0 space-y-1">
                  <Link href={`/admin/catalogue/${r.id}`} className="block font-bold leading-snug text-brand hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-sm text-muted">{r.categoryPath}</p>
                  <StatusBadges row={r} />
                  <p className="text-xs text-muted">Updated {fmtDate(r.updatedAt)}</p>
                </div>
              </div>
              <RowActions row={r} labelled />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <TableWrap>
          <thead>
            <tr>
              {canDelete && (
                <th className="w-10">
                  <SelectAll formId={BULK_FORM} label="Select all products" />
                </th>
              )}
              <th>Product</th>
              <th>Category</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {canDelete && (
                  <td>
                    <RowCheck formId={BULK_FORM} id={r.id} label={`Select ${r.title}`} />
                  </td>
                )}
                <td className="min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <Thumb imageId={r.coverId} icon={r.icon} size={48} />
                    <div className="min-w-0">
                      <Link href={`/admin/catalogue/${r.id}`} className="block font-bold text-brand hover:underline">
                        {r.title}
                      </Link>
                      <span className="block truncate text-xs text-muted">/products/{r.slug}</span>
                    </div>
                  </div>
                </td>
                <td className="min-w-[160px] text-muted">{r.categoryPath}</td>
                <td>
                  <StatusBadges row={r} />
                </td>
                <td className="whitespace-nowrap text-muted">{fmtDate(r.updatedAt)}</td>
                <td>
                  <RowActions row={r} labelled={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
