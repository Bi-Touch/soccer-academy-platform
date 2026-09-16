"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyPlayerOfNewNote } from "@/lib/notifications";
import { requireStaff, requireAdmin, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";

export async function createPlayer(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const position = String(formData.get("position") || "").trim() || null;
  const shirtNumberRaw = String(formData.get("shirtNumber") || "").trim();
  const shirtNumber = shirtNumberRaw ? parseInt(shirtNumberRaw, 10) : null;
  const teamId = String(formData.get("teamId") || "").trim() || null;
  const dateOfBirthRaw = String(formData.get("dateOfBirth") || "").trim();
  const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "PLAYER",
      player: {
        create: { position, shirtNumber, teamId, dateOfBirth, photoUrl },
      },
    },
  });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function updatePlayer(playerId: string, formData: FormData) {
  await requireAdmin();

  const existingPlayer = await prisma.player.findUnique({ where: { id: playerId } });
  if (!existingPlayer) throw new Error("Player not found.");

  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim() || null;
  const shirtNumberRaw = String(formData.get("shirtNumber") || "").trim();
  const shirtNumber = shirtNumberRaw ? parseInt(shirtNumberRaw, 10) : null;
  const teamId = String(formData.get("teamId") || "").trim() || null;
  const dateOfBirthRaw = String(formData.get("dateOfBirth") || "").trim();
  const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;

  await prisma.player.update({
    where: { id: playerId },
    data: { position, shirtNumber, teamId, dateOfBirth, photoUrl },
  });

  if (name) {
    await prisma.user.update({ where: { id: existingPlayer.userId }, data: { name } });
  }

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function deletePlayer(playerId: string) {
  await requireAdmin();

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  await prisma.user.delete({ where: { id: player.userId } }); // cascades to Player
  revalidatePath("/admin/players");
}

export async function upsertPlayerStat(playerId: string, season: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const matchesPlayed = parseInt(String(formData.get("matchesPlayed") || "0"), 10) || 0;
  const goals = parseInt(String(formData.get("goals") || "0"), 10) || 0;
  const assists = parseInt(String(formData.get("assists") || "0"), 10) || 0;
  const minutesPlayed = parseInt(String(formData.get("minutesPlayed") || "0"), 10) || 0;

  const existing = await prisma.playerStat.findFirst({ where: { playerId, season } });

  if (existing) {
    await prisma.playerStat.update({
      where: { id: existing.id },
      data: { matchesPlayed, goals, assists, minutesPlayed },
    });
  } else {
    await prisma.playerStat.create({
      data: { playerId, season, matchesPlayed, goals, assists, minutesPlayed },
    });
  }

  revalidatePath(`/admin/players/${playerId}/edit`);
  revalidatePath("/portal/leaderboard");
  revalidatePath("/portal/dashboard");
  redirect("/admin/players");
}

export async function addProgressNote(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const note = String(formData.get("note") || "").trim();
  if (!note) throw new Error("Note text is required.");

  const session = await getServerSession(authOptions);

  await prisma.progressNote.create({
    data: { playerId, authorName: session?.user?.name || "Coaching staff", note },
  });

  await notifyPlayerOfNewNote(playerId).catch((e) => console.error("Notification failed:", e));

  revalidatePath(`/admin/players/${playerId}/edit`);
  revalidatePath("/portal/profile");
}

export async function assignPlayerToTeam(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const teamId = String(formData.get("teamId") || "").trim();
  if (!teamId) throw new Error("Select a team.");
  assertTeamAccess(accessibleTeamIds, teamId);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  if (player.teamId) throw new Error("This player is already on a team.");

  await prisma.player.update({ where: { id: playerId }, data: { teamId } });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}