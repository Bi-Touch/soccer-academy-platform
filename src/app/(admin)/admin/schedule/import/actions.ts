"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { parseCsv } from "@/lib/csv";
import type { ImportResult } from "@/lib/importResult";
import type { EventType } from "@prisma/client";

const VALID_TYPES = ["TRAINING", "MATCH", "DRILL", "OTHER"];

export async function importSchedule(formData: FormData): Promise<ImportResult> {
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
  });
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));

  const result: ImportResult = { createdCount: 0, updatedCount: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const teamName = (row.team || "").trim();
    const team = teamByName.get(teamName.toLowerCase());
    if (!team) {
      result.errors.push({ row: rowNum, message: `Team "${teamName}" not found or not accessible.` });
      continue;
    }

    const typeRaw = (row.type || "TRAINING").trim().toUpperCase();
    if (!VALID_TYPES.includes(typeRaw)) {
      result.errors.push({ row: rowNum, message: `Invalid type "${row.type}". Must be one of ${VALID_TYPES.join(", ")}.` });
      continue;
    }

    const dateStr = (row.date || "").trim();
    const timeStr = (row.time || "00:00").trim();
    if (!dateStr) {
      result.errors.push({ row: rowNum, message: "Missing date." });
      continue;
    }
    const startsAt = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(startsAt.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid date/time: "${dateStr} ${timeStr}".` });
      continue;
    }

    const title = (row.title || "").trim();
    if (!title) {
      result.errors.push({ row: rowNum, message: "Missing title." });
      continue;
    }

    const homeScoreRaw = (row.homeScore || "").trim();
    const awayScoreRaw = (row.awayScore || "").trim();

    try {
      await prisma.scheduleEvent.create({
        data: {
          teamId: team.id,
          type: typeRaw as EventType,
          title,
          location: row.location || null,
          opponent: row.opponent || null,
          homeScore: homeScoreRaw ? parseInt(homeScoreRaw, 10) : null,
          awayScore: awayScoreRaw ? parseInt(awayScoreRaw, 10) : null,
          description: row.description || null,
          startsAt,
        },
      });
      result.createdCount++;
    } catch {
      result.errors.push({ row: rowNum, message: "Failed to create event." });
    }
  }

  revalidatePath("/admin/schedule");
  return result;
}