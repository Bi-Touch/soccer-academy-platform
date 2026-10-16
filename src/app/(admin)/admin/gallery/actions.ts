"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit, diffFields } from "@/lib/audit";

export async function createPhoto(formData: FormData) {
  const url = String(formData.get("url") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "").trim() || null;

  if (!url) {
    throw new Error("Photo URL is required.");
  }

  const created = await prisma.galleryPhoto.create({ data: { url, caption, teamId } });

  await logAudit({
    action: "gallery.create",
    entityType: "GalleryPhoto",
    entityId: created.id,
    summary: caption ? `Added gallery photo "${caption}"` : "Added a gallery photo",
    changes: diffFields(null, { url, caption, teamId }),
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  redirect("/admin/gallery");
}

export async function deletePhoto(photoId: string) {
  const photo = await prisma.galleryPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await prisma.galleryPhoto.delete({ where: { id: photoId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "gallery.delete",
    entityType: "GalleryPhoto",
    entityId: photoId,
    summary: photo.caption ? `Deleted gallery photo "${photo.caption}"` : "Deleted a gallery photo",
    changes: diffFields(
      { url: photo.url, caption: photo.caption, teamId: photo.teamId },
      { url: null, caption: null, teamId: null }
    ),
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
