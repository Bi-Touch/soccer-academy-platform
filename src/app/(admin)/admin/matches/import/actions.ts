"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { parseCsv } from "@/lib/csv";
import { MATCH_STAT_KEYS } from "@/lib/matchStats";
import type { ImportResult } from "@/lib/importResult";

export async function importMatchStats(formData: FormData): Promise<ImportResult> {
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

    const dateStr = (row.matchDate || "").trim();
    const opponent = (row.opponent || "").trim();
    if (!dateStr || !opponent) {
      result.errors.push({ row: rowNum, message: "Missing matchDate or opponent." });
      continue;
    }

    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59`);
    if (isNaN(dayStart.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid matchDate "${dateStr}".` });
      continue;
    }

    let event = await prisma.scheduleEvent.findFirst({
      where: {
        teamId: team.id,
        type: "MATCH",
        opponent: { equals: opponent, mode: "insensitive" },
        startsAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (!event) {
      event = await prisma.scheduleEvent.create({
        data: {
          teamId: team.id,
          type: "MATCH",
          title: `${team.name} vs ${opponent}`,
          opponent,
          startsAt: dayStart,
        },
      });
    }

    const email = (row.playerEmail || "").trim().toLowerCase();
    const player = team.players.find((p) => p.user?.email?.toLowerCase() === email);
    if (!player) {
      result.errors.push({ row: rowNum, message: `Player with email "${email}" not found on team "${team.name}".` });
      continue;
    }

    const data: Record<string, number> = {};
    for (const key of MATCH_STAT_KEYS) {
      const raw = (row[key] || "").trim();
      data[key] = raw ? parseInt(raw, 10) : 0;
    }

    const existing = await prisma.matchPerformance.findUnique({
      where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
    });

    await prisma.matchPerformance.upsert({
      where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
      create: { eventId: event.id, playerId: player.id, recordedBy: staffUser?.name ?? null, ...data },
      update: { recordedBy: staffUser?.name ?? null, ...data },
    });

    if (existing) result.updatedCount++;
    else result.createdCount++;
  }

  revalidatePath("/admin/matches");
  return result;
}