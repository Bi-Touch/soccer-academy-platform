"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyPlayerOfNewNote } from "@/lib/notifications";
import { requireStaff, requireAdmin, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

function parseSex(formData: FormData): "MALE" | "FEMALE" | null {
  const raw = String(formData.get("sex") || "").trim();
  return raw === "MALE" || raw === "FEMALE" ? raw : null;
}

// Dates are logged as YYYY-MM-DD strings so diffFields compares values, not Date object references.
function dateKey(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

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
  const sex = parseSex(formData);

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "PLAYER",
      player: {
        create: { name, position, shirtNumber, teamId, dateOfBirth, photoUrl, sex },
      },
    },
    include: { player: true },
  });

  // The password and hash are deliberately never logged.
  await logAudit({
    action: "player.create",
    entityType: "Player",
    entityId: created.player?.id ?? created.id,
    summary: `Created player ${name}`,
    changes: diffFields(null, {
      name,
      email,
      position,
      shirtNumber,
      teamId,
      dateOfBirth: dateKey(dateOfBirth),
      photoUrl,
      sex,
    }),
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
  const sex = parseSex(formData);

  await prisma.player.update({
    where: { id: playerId },
    data: { ...(name ? { name } : {}), position, shirtNumber, teamId, dateOfBirth, photoUrl, sex },
  });

  if (name && existingPlayer.userId) {
    await prisma.user.update({ where: { id: existingPlayer.userId }, data: { name } });
  }

  // Must run before redirect(), which throws and stops anything after it.
  await logAudit({
    action: "player.update",
    entityType: "Player",
    entityId: playerId,
    summary: `Updated profile for ${name || existingPlayer.name}`,
    changes: diffFields(
      {
        name: existingPlayer.name,
        position: existingPlayer.position,
        shirtNumber: existingPlayer.shirtNumber,
        teamId: existingPlayer.teamId,
        dateOfBirth: dateKey(existingPlayer.dateOfBirth),
        photoUrl: existingPlayer.photoUrl,
        sex: existingPlayer.sex,
      },
      {
        name: name || existingPlayer.name,
        position,
        shirtNumber,
        teamId,
        dateOfBirth: dateKey(dateOfBirth),
        photoUrl,
        sex,
      }
    ),
  });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}

export async function deletePlayer(playerId: string) {
  await requireAdmin();

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  if (player.userId) {
    await prisma.user.delete({ where: { id: player.userId } }); // cascades to Player
  } else {
    await prisma.player.delete({ where: { id: player.id } });
  }

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "player.delete",
    entityType: "Player",
    entityId: playerId,
    summary: `Deleted player ${player.name}`,
    changes: diffFields(
      {
        name: player.name,
        position: player.position,
        shirtNumber: player.shirtNumber,
        teamId: player.teamId,
      },
      null
    ),
  });

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
  const newValues = { matchesPlayed, goals, assists, minutesPlayed };

  if (existing) {
    await prisma.playerStat.update({
      where: { id: existing.id },
      data: newValues,
    });
  } else {
    await prisma.playerStat.create({
      data: { playerId, season, ...newValues },
    });
  }

  await logAudit({
    action: existing ? "player.stat.update" : "player.stat.create",
    entityType: "PlayerStat",
    entityId: existing?.id ?? playerId,
    summary: `${existing ? "Updated" : "Added"} ${season} stats for ${player.name}`,
    changes: diffFields(
      existing
        ? {
            matchesPlayed: existing.matchesPlayed,
            goals: existing.goals,
            assists: existing.assists,
            minutesPlayed: existing.minutesPlayed,
          }
        : null,
      newValues
    ),
  });

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

  const created = await prisma.progressNote.create({
    data: { playerId, authorName: session?.user?.name || "Coaching staff", note },
  });

  // The note text itself is not copied into the audit log, only the fact that it was added.
  await logAudit({
    action: "player.note.add",
    entityType: "ProgressNote",
    entityId: created.id,
    summary: `Added a progress note for ${player.name}`,
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

  await logAudit({
    action: "player.team.assign",
    entityType: "Player",
    entityId: playerId,
    summary: `Assigned ${player.name} to a team`,
    changes: diffFields({ teamId: player.teamId }, { teamId }),
  });

  revalidatePath("/admin/players");
  redirect("/admin/players");
}
