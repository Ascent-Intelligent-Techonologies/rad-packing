"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/components/crm/forms";
import { requireUser } from "@/lib/crm/auth";
import { text } from "@/lib/crm/format";
import { LIMITS, parseLines, parseSpecs, parseTags } from "@/lib/catalogue/shared";
import { getDb } from "@/lib/db";
import { errorCode, parsePhotoList, publishChanges, resolveSlug } from "./helpers";

const LIST = "/admin/catalogue";

/** Create (no `id`) or update (with `id`) a website product, including its photos. */
export async function saveCatalogueProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("website");
  const db = getDb()!;

  const id = text(fd.get("id"));
  const title = text(fd.get("title"));
  if (!title) return { error: "Title is required." };
  if (title.length > LIMITS.title) return { error: `Title is too long (${LIMITS.title} characters max).` };

  const categoryId = text(fd.get("categoryId"));
  if (!categoryId) return { error: "Choose a category." };
  if (!(await db.catalogCategory.findUnique({ where: { id: categoryId }, select: { id: true } }))) {
    return { error: "That category no longer exists. Choose another one." };
  }

  const summary = text(fd.get("summary"));
  if (summary && summary.length > LIMITS.summary) return { error: `The short summary is too long (${LIMITS.summary} characters max).` };
  const description = text(fd.get("description"));
  if (description && description.length > LIMITS.description) return { error: `The description is too long (${LIMITS.description} characters max).` };

  const list = parsePhotoList(fd.get("images"), LIMITS.imagesPerProduct, "product");
  if (!list.ok) return { error: list.error };
  const photoIds = list.photos.map((p) => p.id);
  if (photoIds.length) {
    const found = await db.catalogImage.findMany({ where: { id: { in: photoIds } }, select: { id: true, productId: true, categoryId: true } });
    const usable = found.filter((i) => i.categoryId === null && (i.productId === null || i.productId === id));
    if (usable.length !== photoIds.length) {
      return { error: "One of the photos is no longer available. Remove it and add it again." };
    }
  }

  const slug = await resolveSlug({
    fd,
    fallback: title,
    noun: "product",
    findTaken: async (prefix) =>
      (
        await db.catalogProduct.findMany({
          where: { slug: { startsWith: prefix }, ...(id ? { NOT: { id } } : {}) },
          select: { slug: true },
          take: 500,
        })
      ).map((p) => p.slug),
  });
  if (!slug.ok) return { error: slug.error };

  const published = fd.get("published") === "on";
  const data = {
    slug: slug.slug,
    title,
    summary,
    description,
    highlights: parseLines(String(fd.get("highlights") ?? ""), LIMITS.highlights, LIMITS.highlight),
    specs: parseSpecs(String(fd.get("specs") ?? "")),
    tags: parseTags(String(fd.get("tags") ?? "")),
    published,
    featured: fd.get("featured") === "on",
    categoryId,
  };

  let savedId: string;
  try {
    savedId = await db.$transaction(async (tx) => {
      const product = id ? await tx.catalogProduct.update({ where: { id }, data }) : await tx.catalogProduct.create({ data });
      await tx.catalogImage.deleteMany({ where: { productId: product.id, id: { notIn: photoIds } } });
      for (const [position, photo] of list.photos.entries()) {
        await tx.catalogImage.update({ where: { id: photo.id }, data: { productId: product.id, position, alt: photo.alt } });
      }
      return product.id;
    });
  } catch (e) {
    const code = errorCode(e);
    if (code === "P2002") return { error: "Another product just took that web address. Change it and save again." };
    if (code === "P2025") return { error: id ? "That product no longer exists." : "A photo or category was removed while saving. Please try again." };
    if (code === "P2003") return { error: "That category no longer exists. Choose another one." };
    console.error("saveCatalogueProduct failed", e);
    return { error: "Couldn't save the product. Please try again." };
  }

  publishChanges();
  if (!id) redirect(`${LIST}/${savedId}?saved=1`);
  return {
    ok: true,
    message: published ? "Saved. The change is live on the website." : "Saved as a draft. It is not shown on the website yet.",
  };
}

/** Publish (`publish=1`) or unpublish a product from the list. */
export async function toggleCataloguePublished(fd: FormData): Promise<void> {
  await requireUser("website");
  const id = text(fd.get("id"));
  if (!id) return;
  await getDb()!.catalogProduct.updateMany({ where: { id }, data: { published: fd.get("publish") === "1" } });
  publishChanges();
}

/** Delete one product and its photos, then go back to the list. */
export async function deleteCatalogueProduct(fd: FormData): Promise<void> {
  await requireUser("delete");
  const id = text(fd.get("id"));
  if (!id) return;
  await getDb()!.catalogProduct.deleteMany({ where: { id } });
  publishChanges();
  redirect(LIST);
}

/** Delete several products at once (list page). */
export async function bulkDeleteCatalogueProducts(fd: FormData): Promise<void> {
  await requireUser("delete");
  const ids = [...new Set(fd.getAll("ids").map(String))].filter(Boolean).slice(0, 500);
  if (!ids.length) return;
  await getDb()!.catalogProduct.deleteMany({ where: { id: { in: ids } } });
  publishChanges();
}
