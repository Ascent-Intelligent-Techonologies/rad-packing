"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";

/** Delete one conversation and all of its messages. */
export async function deleteChat(id: string): Promise<void> {
  await requireUser("delete");
  await getDb()!.chatSession.deleteMany({ where: { id } });
  revalidatePath("/admin/chats");
  revalidatePath("/admin");
  redirect("/admin/chats");
}

/** Delete several conversations at once (list page). */
export async function bulkDeleteChats(fd: FormData): Promise<void> {
  await requireUser("delete");
  const ids = [...new Set(fd.getAll("ids").map(String))].filter(Boolean).slice(0, 500);
  if (!ids.length) return;
  await getDb()!.chatSession.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/chats");
  revalidatePath("/admin");
}
