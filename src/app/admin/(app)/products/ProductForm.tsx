import Link from "next/link";
import { Field } from "@/components/crm/ui";
import { ActionForm, SubmitButton } from "@/components/crm/forms";
import { UNITS, productLineOptions } from "@/lib/crm/constants";
import { fromFils } from "@/lib/crm/format";
import { saveProduct } from "./actions";

export type ProductFormValues = {
  id?: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  unitPriceFils: number;
  description: string | null;
  active: boolean;
};

/** Add / edit form for one price-list entry (server component; the form itself is client-wired via ActionForm). */
export function ProductForm({ product, onDoneHref }: { product?: ProductFormValues; onDoneHref?: string }) {
  const units = product && !UNITS.includes(product.unit) ? [...UNITS, product.unit] : UNITS;
  return (
    <ActionForm action={saveProduct} resetOnSuccess={!product}>
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name *" className="sm:col-span-2">
          <input name="name" required maxLength={200} defaultValue={product?.name ?? ""} className="field-sm" placeholder="e.g. VCI film roll 1.5 m × 200 m" />
        </Field>
        <Field label="SKU">
          <input name="sku" maxLength={60} defaultValue={product?.sku ?? ""} className="field-sm" />
        </Field>
        <Field label="Category">
          <select name="category" defaultValue={product?.category ?? ""} className="field-sm">
            <option value="">Uncategorised</option>
            {productLineOptions([product?.category]).map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unit">
          <select name="unit" defaultValue={product?.unit ?? "pcs"} className="field-sm">
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unit price (AED)">
          <input name="price" inputMode="decimal" defaultValue={product ? fromFils(product.unitPriceFils) : ""} className="field-sm" placeholder="0.00" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <input name="description" maxLength={1000} defaultValue={product?.description ?? ""} className="field-sm" />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-[42px] items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={product ? product.active : true} className="h-5 w-5 accent-[var(--brand)]" />
          Active (available in the quote builder)
        </label>
        <div className="flex items-center gap-2">
          {onDoneHref && (
            <Link href={onDoneHref} className="btn btn-outline !min-h-[42px] !px-5 text-sm">
              Close
            </Link>
          )}
          <SubmitButton>{product ? "Save changes" : "Add product"}</SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
