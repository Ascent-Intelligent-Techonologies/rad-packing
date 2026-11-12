"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type ActionState } from "@/components/crm/forms";
import { Field, Panel } from "@/components/crm/ui";
import { LIMITS } from "@/lib/catalogue/shared";
import { CategorySelect, type CategoryOption } from "./CategorySelect";
import { FORMAT_HELP } from "./copy";
import { hasPendingPhotos, photoItemsFrom, PhotoUploader } from "./PhotoUploader";
import { SlugField, useAutoSlug } from "./SlugField";

export type ProductFormValues = {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  summary: string;
  description: string;
  /** one per line */
  highlights: string;
  /** "Label: value" per line */
  specs: string;
  /** comma separated */
  tags: string;
  published: boolean;
  featured: boolean;
  images: { id: string; alt: string }[];
};

const checkbox = "mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]";

/** Add / edit form for a website product. The save action is passed in so this file stays free of server imports. */
export function ProductForm({
  action,
  product,
  categories,
  defaultCategoryId = "",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  product?: ProductFormValues;
  categories: CategoryOption[];
  defaultCategoryId?: string;
}) {
  const slug = useAutoSlug({ title: product?.title ?? "", slug: product?.slug ?? "" }, !product);
  const [summary, setSummary] = useState(product?.summary ?? "");
  const [photos, setPhotos] = useState(() => photoItemsFrom(product?.images ?? []));
  const uploading = hasPendingPhotos(photos);

  return (
    <ActionForm action={action}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title *" className="sm:col-span-2">
                <input
                  name="title"
                  required
                  maxLength={LIMITS.title}
                  value={slug.title}
                  onChange={(e) => slug.setTitle(e.target.value)}
                  placeholder="e.g. VCI film roll 1.5 m × 200 m"
                  className="field-sm"
                />
              </Field>
              <Field label="Category *" hint="Products can sit in any category or sub-category.">
                <CategorySelect name="categoryId" required defaultValue={product?.categoryId ?? defaultCategoryId} options={categories} placeholder="Choose a category…" />
              </Field>
              <SlugField
                slug={slug.slug}
                auto={slug.auto}
                onChange={slug.setSlug}
                onBlur={slug.tidySlug}
                hint={`Public address: /products/${slug.slug || "…"}${product ? ". Changing it breaks old links to this product." : ""}`}
              />
              <Field label="Short summary" className="sm:col-span-2" hint={`${summary.length} / ${LIMITS.summary}. Shown on product cards.`}>
                <textarea
                  name="summary"
                  rows={3}
                  maxLength={LIMITS.summary}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One or two sentences that sell the product."
                  className="field-sm"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Photos">
            <PhotoUploader photos={photos} onChange={setPhotos} max={LIMITS.imagesPerProduct} />
          </Panel>

          <Panel title="Description and specifications">
            <div className="grid gap-4">
              <Field label="Description" hint={FORMAT_HELP}>
                <textarea name="description" rows={10} maxLength={LIMITS.description} defaultValue={product?.description ?? ""} className="field-sm" />
              </Field>
              <Field label="Key features" hint={`One per line. Up to ${LIMITS.highlights} points.`}>
                <textarea
                  name="highlights"
                  rows={5}
                  defaultValue={product?.highlights ?? ""}
                  placeholder={"Protects steel for up to 2 years\nNo oil or grease needed"}
                  className="field-sm"
                />
              </Field>
              <Field label="Specifications" hint={`One per line as "Label: value", e.g. Thickness: 80 micron. Up to ${LIMITS.specs} rows.`}>
                <textarea
                  name="specs"
                  rows={5}
                  defaultValue={product?.specs ?? ""}
                  placeholder={"Thickness: 80 micron\nWidth: 1.5 m\nRoll length: 200 m"}
                  className="field-sm"
                />
              </Field>
              <Field label="Tags" hint={`Separate with commas. Up to ${LIMITS.tags} tags.`}>
                <input name="tags" defaultValue={product?.tags ?? ""} placeholder="VCI, rust protection, steel" className="field-sm" />
              </Field>
            </div>
          </Panel>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <Panel title="Publishing">
            <div className="space-y-4">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="published" defaultChecked={product ? product.published : true} className={checkbox} />
                <span>
                  <span className="block font-semibold">Published</span>
                  <span className="block text-xs text-muted">Visible on the website. Untick to keep it as a draft.</span>
                </span>
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className={checkbox} />
                <span>
                  <span className="block font-semibold">Featured</span>
                  <span className="block text-xs text-muted">Highlight this product on the website.</span>
                </span>
              </label>
              {uploading ? (
                <button type="submit" disabled className="btn btn-brand !min-h-[44px] !px-5 w-full text-sm disabled:opacity-60">
                  Uploading photos…
                </button>
              ) : (
                <SubmitButton className="btn btn-brand !min-h-[44px] !px-5 w-full text-sm">{product ? "Save changes" : "Add product"}</SubmitButton>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </ActionForm>
  );
}
