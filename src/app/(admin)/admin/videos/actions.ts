"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

export async function createVideo(formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const url = String(formData.get("url") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "").trim() || null;
  const playerIds = [...new Set(formData.getAll("playerIds").map(String).filter(Boolean))];

  if (!title || !url) {
    throw new Error("Title and video URL are required.");
  }

  // Coaches must pick one of their own teams; only admins may post "All teams" (teamId = null).
  if (accessibleTeamIds !== null) {
    assertTeamAccess(accessibleTeamIds, teamId);
  }

  // Tagged players must exist, and coaches may only tag players on their own teams.
  if (playerIds.length > 0) {
    const tagged = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, teamId: true },
    });
    if (tagged.length !== playerIds.length) {
      throw new Error("One or more selected players were not found.");
    }
    if (teamId) {
      for (const p of tagged) {
        if (p.teamId !== teamId) {
          throw new Error("Tagged players must belong to the selected team.");
        }
      }
    }
    if (accessibleTeamIds !== null) {
      for (const p of tagged) assertTeamAccess(accessibleTeamIds, p.teamId);
    }
  }

  const created = await prisma.video.create({
    data: {
      title,
      description,
      url,
      thumbnailUrl,
      teamId,
      players: { connect: playerIds.map((id) => ({ id })) },
    },
    include: { team: { select: { name: true } } },
  });

  // Videos can be tagged to individual (under-18) players, so the tagged players are recorded by ID.
  await logAudit({
    action: "video.create",
    entityType: "Video",
    entityId: created.id,
    summary: `Added video "${title}" for ${created.team?.name ?? "all teams"}`,
    changes: diffFields(null, {
      title,
      url,
      team: created.team?.name ?? "All teams",
      taggedPlayerCount: playerIds.length,
      taggedPlayerIds: [...playerIds].sort(),
    }),
  });

  revalidatePath("/admin/videos");
  revalidatePath("/portal/videos");
  redirect("/admin/videos");
}

export async function deleteVideo(videoId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { team: { select: { name: true } }, players: { select: { id: true } } },
  });
  if (!video) return;
  if (accessibleTeamIds !== null) {
    assertTeamAccess(accessibleTeamIds, video.teamId);
  }

  await prisma.video.delete({ where: { id: videoId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "video.delete",
    entityType: "Video",
    entityId: videoId,
    summary: `Deleted video "${video.title}" for ${video.team?.name ?? "all teams"}`,
    changes: {
      ...diffFields(
        { title: video.title, url: video.url },
        { title: null, url: null }
      ),
      taggedPlayersAtDeletion: video.players.length,
    },
  });

  revalidatePath("/admin/videos");
  revalidatePath("/portal/videos");
}
