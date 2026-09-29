"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { parseCsv } from "@/lib/csv";
import type { ImportResult } from "@/lib/importResult";
import { ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";
import { playerName } from "@/lib/playerDisplay";

const ATTRIBUTE_TO_DOMAIN = new Map<string, "TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL">();
for (const [domain, attrs] of Object.entries(ASSESSMENT_ATTRIBUTES) as [
  "TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL",
  string[]
][]) {
  for (const attr of attrs) ATTRIBUTE_TO_DOMAIN.set(attr, domain);
}
const ALL_ATTRIBUTES = [...ATTRIBUTE_TO_DOMAIN.keys()];

export async function importAssessments(formData: FormData): Promise<ImportResult> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });

  const file = formData.get("file") as File | null;
  if (!file) {
    return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "No file uploaded." }] };
  }

  const text = await file.text();
  const rows = parseCsv(text);

  const players = await prisma.player.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { user: true, team: true },
  });
  const playerByKey = new Map(
    players.map((p) => [`${playerName(p).toLowerCase()}|${(p.team?.name ?? "").toLowerCase()}`, p])
  );

  const result: ImportResult = { createdCount: 0, updatedCount: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const playerNameRaw = (row.player || "").trim();
    const teamNameRaw = (row.team || "").trim();
    const key = `${playerNameRaw.toLowerCase()}|${teamNameRaw.toLowerCase()}`;
    const player = playerByKey.get(key);
    if (!player) {
      result.errors.push({ row: rowNum, message: `Player "${playerNameRaw}" on team "${teamNameRaw}" not found or not accessible.` });
      continue;
    }

    const dateStr = (row.date || "").trim();
    if (!dateStr) {
      result.errors.push({ row: rowNum, message: "Missing date." });
      continue;
    }
    const assessedAt = new Date(dateStr);
    if (isNaN(assessedAt.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid date: "${dateStr}".` });
      continue;
    }

    const scores: { domain: "TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL"; attribute: string; score: number }[] = [];
    let rowHasError = false;

    for (const attr of ALL_ATTRIBUTES) {
      const raw = (row[attr] || "").trim();
      if (!raw) continue;
      const score = parseInt(raw, 10);
      if (isNaN(score) || score < 1 || score > 5) {
        result.errors.push({ row: rowNum, message: `"${attr}" must be a number 1–5 (got "${raw}").` });
        rowHasError = true;
        break;
      }
      scores.push({ domain: ATTRIBUTE_TO_DOMAIN.get(attr)!, attribute: attr, score });
    }
    if (rowHasError) continue;

    try {
      await prisma.developmentAssessment.create({
        data: {
          playerId: player.id,
          assessedAt,
          assessedBy: (row.assessedBy || "").trim() || staffUser?.name || null,
          summary: (row.summary || "").trim() || null,
          nextGoals: (row.nextGoals || "").trim() || null,
          scores: { create: scores },
        },
      });
      result.createdCount++;
    } catch {
      result.errors.push({ row: rowNum, message: "Failed to create assessment." });
    }
  }

  revalidatePath("/admin/assessments");
  return result;
}