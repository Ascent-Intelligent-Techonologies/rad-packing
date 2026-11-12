"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type ActionState } from "@/components/crm/forms";
import { Field, Panel } from "@/components/crm/ui";
import { LIMITS, MAX_DEPTH } from "@/lib/catalogue/shared";
import { CategorySelect, type CategoryOption } from "./CategorySelect";
import { FORMAT_HELP } from "./copy";
import { IconPicker } from "./IconPicker";
import { hasPendingPhotos, photoItemsFrom, PhotoUploader } from "./PhotoUploader";
import { SlugField, useAutoSlug } from "./SlugField";

export type CategoryFormValues = {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  summary: string;
  description: string;
  icon: string;
  published: boolean;
  image: { id: string; alt: string } | null;
};

/** Add / edit form for a catalogue category (or sub-category). */
export function CategoryForm({
  action,
  category,
  parents,
  defaultParentId = "",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  category?: CategoryFormValues;
  /** where this category may be placed; already excludes itself, its descendants and too-deep spots */
  parents: CategoryOption[];
  defaultParentId?: string;
}) {
  const slug = useAutoSlug({ title: category?.name ?? "", slug: category?.slug ?? "" }, !category);
  const [photos, setPhotos] = useState(() => photoItemsFrom(category?.image ? [category.image] : []));
  const uploading = hasPendingPhotos(photos);

  return (
    <ActionForm action={action}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name *" className="sm:col-span-2">
                <input
                  name="name"
                  required
                  maxLength={LIMITS.name}
                  value={slug.title}
                  onChange={(e) => slug.setTitle(e.target.value)}
                  placeholder="e.g. Anti-Corrosion"
                  className="field-sm"
                />
              </Field>
              <Field label="Sits under" hint={`Leave as top-level for a main category. Categories can be nested ${MAX_DEPTH} levels deep.`}>
                <CategorySelect name="parentId" defaultValue={category?.parentId ?? defaultParentId} options={parents} placeholder="Top-level category" />
              </Field>
              <SlugField
                slug={slug.slug}
                auto={slug.auto}
                onChange={slug.setSlug}
                onBlur={slug.tidySlug}
                hint={`The last part of the category's web address${category ? ". Changing it breaks old links to this category." : "."}`}
              />
              <Field label="Summary" className="sm:col-span-2" hint="One line shown on category cards.">
                <input name="summary" maxLength={LIMITS.summary} defaultValue={category?.summary ?? ""} className="field-sm" />
              </Field>
              <Field label="Description" className="sm:col-span-2" hint={FORMAT_HELP}>
                <textarea name="description" rows={8} maxLength={LIMITS.description} defaultValue={category?.description ?? ""} className="field-sm" />
              </Field>
            </div>
          </Panel>

          <Panel title="Cover photo (optional)">
            <PhotoUploader photos={photos} onChange={setPhotos} max={LIMITS.imagesPerCategory} />
          </Panel>

          <Panel title="Icon">
            <IconPicker defaultValue={category?.icon || "package"} />
          </Panel>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <Panel title="Publishing">
            <div className="space-y-4">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={category ? category.published : true}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
                />
                <span>
                  <span className="block font-semibold">Published</span>
                  <span className="block text-xs text-muted">
                    Visible on the website. Unticking hides the category and everything inside it.
                  </span>
                </span>
              </label>
              {uploading ? (
                <button type="submit" disabled className="btn btn-brand !min-h-[44px] !px-5 w-full text-sm disabled:opacity-60">
                  Uploading photo…
                </button>
              ) : (
                <SubmitButton className="btn btn-brand !min-h-[44px] !px-5 w-full text-sm">
                  {category ? "Save changes" : "Add category"}
                </SubmitButton>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </ActionForm>
  );
}
