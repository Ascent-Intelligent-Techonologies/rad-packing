"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/components/crm/forms";
import { requireUser } from "@/lib/crm/auth";
import { text } from "@/lib/crm/format";
import { LIMITS, MAX_DEPTH, isCategoryIcon } from "@/lib/catalogue/shared";
import { getDb } from "@/lib/db";
import { loadCategoryIndex, subtreeHeight } from "../data";
import { errorCode, parsePhotoList, publishChanges, resolveSlug } from "../helpers";

const LIST = "/admin/catalogue/categories";

/** Create (no `id`) or update (with `id`) a category, including its optional cover photo. */
export async function saveCatalogueCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("website");
  const db = getDb()!;

  const id = text(fd.get("id"));
  const name = text(fd.get("name"));
  if (!name) return { error: "Name is required." };
  if (name.length > LIMITS.name) return { error: `Name is too long (${LIMITS.name} characters max).` };
  const summary = text(fd.get("summary"));
  if (summary && summary.length > LIMITS.summary) return { error: `The summary is too long (${LIMITS.summary} characters max).` };
  const description = text(fd.get("description"));
  if (description && description.length > LIMITS.description) return { error: `The description is too long (${LIMITS.description} characters max).` };

  // where it sits in the tree
  const index = await loadCategoryIndex();
  const current = id ? index.byId.get(id) : undefined;
  if (id && !current) return { error: "That category no longer exists." };
  const parentId = text(fd.get("parentId"));
  if (parentId) {
    if (!index.byId.has(parentId)) return { error: "That parent category no longer exists. Choose another one." };
    if (id && index.subtreeIds(id).includes(parentId)) {
      return { error: "A category can't be moved inside itself or one of its own sub-categories." };
    }
    if (index.chain(parentId).length + (id ? subtreeHeight(index, id) : 1) > MAX_DEPTH) {
      return { error: `Categories can be nested ${MAX_DEPTH} levels deep at most. Choose a higher parent.` };
    }
  }

  const list = parsePhotoList(fd.get("images"), LIMITS.imagesPerCategory, "category");
  if (!list.ok) return { error: list.error };
  const photoIds = list.photos.map((p) => p.id);
  if (photoIds.length) {
    const found = await db.catalogImage.findMany({ where: { id: { in: photoIds } }, select: { id: true, productId: true, categoryId: true } });
    const usable = found.filter((i) => i.productId === null && (i.categoryId === null || i.categoryId === id));
    if (usable.length !== photoIds.length) return { error: "The photo is no longer available. Remove it and add it again." };
  }

  const slug = await resolveSlug({
    fd,
    fallback: name,
    noun: "category",
    findTaken: async (prefix) =>
      (
        await db.catalogCategory.findMany({
          where: { slug: { startsWith: prefix }, ...(id ? { NOT: { id } } : {}) },
          select: { slug: true },
          take: 500,
        })
      ).map((c) => c.slug),
  });
  if (!slug.ok) return { error: slug.error };

  // new, or moved to another parent: goes to the end of its new siblings
  let position: number | undefined;
  if (!current || (current.parentId ?? null) !== parentId) {
    const last = await db.catalogCategory.aggregate({ where: { parentId }, _max: { position: true } });
    position = (last._max.position ?? -1) + 1;
  }

  const icon = text(fd.get("icon"));
  const data = {
    slug: slug.slug,
    name,
    summary,
    description,
    icon: isCategoryIcon(icon) ? icon : null,
    published: fd.get("published") === "on",
    parentId,
    position,
  };

  let savedId: string;
  try {
    savedId = await db.$transaction(async (tx) => {
      const category = id ? await tx.catalogCategory.update({ where: { id }, data }) : await tx.catalogCategory.create({ data });
      await tx.catalogImage.deleteMany({ where: { categoryId: category.id, id: { notIn: photoIds } } });
      for (const [i, photo] of list.photos.entries()) {
        await tx.catalogImage.update({ where: { id: photo.id }, data: { categoryId: category.id, position: i, alt: photo.alt } });
      }
      return category.id;
    });
  } catch (e) {
    const code = errorCode(e);
    if (code === "P2002") return { error: "Another category just took that web address. Change it and save again." };
    if (code === "P2025") return { error: id ? "That category no longer exists." : "A photo was removed while saving. Please try again." };
    if (code === "P2003") return { error: "The parent category no longer exists. Choose another one." };
    console.error("saveCatalogueCategory failed", e);
    return { error: "Couldn't save the category. Please try again." };
  }

  publishChanges();
  if (!id) redirect(`${LIST}/${savedId}?saved=1`);
  return { ok: true, message: "Saved. The change is live on the website." };
}

/** Swap a category with the sibling above (`dir=up`) or below (`dir=down`). */
export async function moveCatalogueCategory(fd: FormData): Promise<void> {
  await requireUser("website");
  const id = text(fd.get("id"));
  const step = fd.get("dir") === "up" ? -1 : fd.get("dir") === "down" ? 1 : 0;
  if (!id || !step) return;

  const index = await loadCategoryIndex();
  const category = index.byId.get(id);
  if (!category) return;
  const order = index.childrenOf(category.parentId).map((c) => c.id);
  const from = order.indexOf(id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to]!, order[from]!];

  // renumber 0..n so positions are always distinct, writing only the rows that change
  const db = getDb()!;
  const changes = order.flatMap((siblingId, position) =>
    index.byId.get(siblingId)!.position === position ? [] : [db.catalogCategory.update({ where: { id: siblingId }, data: { position } })],
  );
  await db.$transaction(changes);
  publishChanges();
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Delete an empty category. Refuses while it still holds sub-categories or products. */
export async function deleteCatalogueCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser("delete");
  const id = text(fd.get("id"));
  if (!id) return { error: "Nothing to delete." };
  const db = getDb()!;

  const category = await db.catalogCategory.findUnique({ where: { id }, select: { _count: { select: { children: true, products: true } } } });
  if (category) {
    const { children, products } = category._count;
    if (children || products) {
      const parts = [children && plural(children, "sub-category", "sub-categories"), products && plural(products, "product", "products")].filter(Boolean);
      return { error: `Move or delete the ${parts.join(" and ")} in it first.` };
    }
    try {
      await db.catalogCategory.delete({ where: { id } });
    } catch (e) {
      if (errorCode(e) === "P2003") return { error: "Something was just added to this category. Move or delete it first." };
      if (errorCode(e) !== "P2025") {
        console.error("deleteCatalogueCategory failed", e);
        return { error: "Couldn't delete the category. Please try again." };
      }
    }
  }
  publishChanges();
  redirect(LIST);
}
