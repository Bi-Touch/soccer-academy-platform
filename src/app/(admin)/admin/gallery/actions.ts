"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPhoto(formData: FormData) {
  const url = String(formData.get("url") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "").trim() || null;

  if (!url) {
    throw new Error("Photo URL is required.");
  }

  await prisma.galleryPhoto.create({ data: { url, caption, teamId } });

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  redirect("/admin/gallery");
}

export async function deletePhoto(photoId: string) {
  await prisma.galleryPhoto.delete({ where: { id: photoId } });
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}