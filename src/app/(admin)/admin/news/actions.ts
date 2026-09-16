"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createNewsPost(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim() || null;
  const body = String(formData.get("body") || "").trim();
  const coverUrl = String(formData.get("coverUrl") || "").trim() || null;

  if (!title || !body) {
    throw new Error("Title and body are required.");
  }

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.newsPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  await prisma.newsPost.create({
    data: { title, slug, excerpt, body, coverUrl },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

export async function updateNewsPost(postId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim() || null;
  const body = String(formData.get("body") || "").trim();
  const coverUrl = String(formData.get("coverUrl") || "").trim() || null;

  if (!title || !body) {
    throw new Error("Title and body are required.");
  }

  await prisma.newsPost.update({
    where: { id: postId },
    data: { title, excerpt, body, coverUrl },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

export async function deleteNewsPost(postId: string) {
  await prisma.newsPost.delete({ where: { id: postId } });
  revalidatePath("/admin/news");
  revalidatePath("/news");
}