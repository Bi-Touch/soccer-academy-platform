"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { parseCsv } from "@/lib/csv";
import type { ImportResult } from "@/lib/importResult";
import type { AttendanceStatus } from "@prisma/client";

const VALID_STATUSES = ["PRESENT", "LATE", "ABSENT_EXCUSED", "ABSENT_UNEXCUSED", "INJURED"];

export async function importTrainingLog(formData: FormData): Promise<ImportResult> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const file = formData.get("file") as File | null;
  if (!file) {
    return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "No file uploaded." }] };
  }

  const text = await file.text();
  const rows = parseCsv(text);

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
    include: { players: { include: { user: true } } },
  });
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));

  const result: ImportResult = { createdCount: 0, updatedCount: 0, errors: [] };
  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const teamName = (row.team || "").trim();
    const team = teamByName.get(teamName.toLowerCase());
    if (!team) {
      result.errors.push({ row: rowNum, message: `Team "${teamName}" not found or not accessible.` });
      continue;
    }

    const dateStr = (row.sessionDate || "").trim();
    const timeStr = (row.sessionTime || "16:00").trim();
    const title = (row.sessionTitle || "").trim();
    if (!dateStr || !title) {
      result.errors.push({ row: rowNum, message: "Missing sessionDate or sessionTitle." });
      continue;
    }

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59`);
    if (isNaN(dayStart.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid sessionDate "${dateStr}".` });
      continue;
    }

    let event = await prisma.scheduleEvent.findFirst({
      where: {
        teamId: team.id,
        type: "TRAINING",
        title: { equals: title, mode: "insensitive" },
        startsAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (!event) {
      const startsAt = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(startsAt.getTime())) {
        result.errors.push({ row: rowNum, message: `Invalid sessionTime "${timeStr}".` });
        continue;
      }
      event = await prisma.scheduleEvent.create({
        data: { teamId: team.id, type: "TRAINING", title, startsAt },
      });
    }

    const email = (row.playerEmail || "").trim().toLowerCase();
    const player = team.players.find((p) => p.user.email.toLowerCase() === email);
    if (!player) {
      result.errors.push({ row: rowNum, message: `Player with email "${email}" not found on team "${team.name}".` });
      continue;
    }

    const statusRaw = (row.status || "PRESENT").trim().toUpperCase();
    const status = (VALID_STATUSES.includes(statusRaw) ? statusRaw : "PRESENT") as AttendanceStatus;
    const ratingRaw = (row.rating || "").trim();

    const existing = await prisma.trainingAttendance.findUnique({
      where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
    });

    const data = {
      status,
      rating: ratingRaw ? parseInt(ratingRaw, 10) : null,
      note: row.note || null,
      recordedBy: staffUser?.name ?? null,
    };

    await prisma.trainingAttendance.upsert({
      where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
      create: { eventId: event.id, playerId: player.id, ...data },
      update: data,
    });

    if (existing) result.updatedCount++;
    else result.createdCount++;
  }

  revalidatePath("/admin/training");
  return result;
}