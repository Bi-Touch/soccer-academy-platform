"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";

export async function createVideo(formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const url = String(formData.get("url") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "").trim() || null;

  if (!title || !url) {
    throw new Error("Title and video URL are required.");
  }

  // Coaches must pick one of their own teams; only admins may post "All teams" (teamId = null).
  if (accessibleTeamIds !== null) {
    assertTeamAccess(accessibleTeamIds, teamId);
  }

  await prisma.video.create({
    data: { title, description, url, thumbnailUrl, teamId },
  });

  revalidatePath("/admin/videos");
  revalidatePath("/portal/videos");
  redirect("/admin/videos");
}

export async function deleteVideo(videoId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return;
  if (accessibleTeamIds !== null) {
    assertTeamAccess(accessibleTeamIds, video.teamId);
  }

  await prisma.video.delete({ where: { id: videoId } });
  revalidatePath("/admin/videos");
  revalidatePath("/portal/videos");
}