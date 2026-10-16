"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createNewsPost(formData: FormData) {
  await requireAdmin();

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

  const created = await prisma.newsPost.create({
    data: { title, slug, excerpt, body, coverUrl },
  });

  // The article body is long and public, so only its length is logged.
  await logAudit({
    action: "news.create",
    entityType: "NewsPost",
    entityId: created.id,
    summary: `Created news post "${title}"`,
    changes: diffFields(null, { title, slug, excerpt, coverUrl, bodyLength: body.length }),
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

export async function updateNewsPost(postId: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim() || null;
  const body = String(formData.get("body") || "").trim();
  const coverUrl = String(formData.get("coverUrl") || "").trim() || null;

  if (!title || !body) {
    throw new Error("Title and body are required.");
  }

  const before = await prisma.newsPost.findUnique({ where: { id: postId } });
  if (!before) throw new Error("News post not found.");

  await prisma.newsPost.update({
    where: { id: postId },
    data: { title, excerpt, body, coverUrl },
  });

  const changes = diffFields(
    { title: before.title, excerpt: before.excerpt, coverUrl: before.coverUrl },
    { title, excerpt, coverUrl }
  );
  if (before.body !== body) {
    changes.bodyLength = { from: before.body.length, to: body.length };
  }

  await logAudit({
    action: "news.update",
    entityType: "NewsPost",
    entityId: postId,
    summary: `Updated news post "${title}"`,
    changes,
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

export async function deleteNewsPost(postId: string) {
  await requireAdmin();

  const post = await prisma.newsPost.findUnique({ where: { id: postId } });
  if (!post) return;

  await prisma.newsPost.delete({ where: { id: postId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "news.delete",
    entityType: "NewsPost",
    entityId: postId,
    summary: `Deleted news post "${post.title}"`,
    changes: diffFields(
      { title: post.title, slug: post.slug },
      { title: null, slug: null }
    ),
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
}
