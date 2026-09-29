"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { parseCsv } from "@/lib/csv";
import type { ImportResult } from "@/lib/importResult";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { ageGroupForDate, findBenchmark, scoreResult } from "@/lib/benchmarkScoring";
import { playerName } from "@/lib/playerDisplay";

export async function importPhysicalTests(formData: FormData): Promise<ImportResult> {
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
    const testedAt = new Date(dateStr);
    if (isNaN(testedAt.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid date: "${dateStr}".` });
      continue;
    }

    const results: {
      metric: string;
      testCode: string;
      value: number;
      unit: string;
      score: number | null;
      benchmarkVersion: string | null;
    }[] = [];
    let rowHasError = false;

    const ageGroup = player.dateOfBirth ? ageGroupForDate(player.dateOfBirth, testedAt) : null;

    for (const m of PHYSICAL_TEST_METRICS) {
      const raw = (row[m.label] || "").trim();
      if (!raw) continue;
      const value = parseFloat(raw);
      if (isNaN(value) || value < 0) {
        result.errors.push({ row: rowNum, message: `"${m.label}" must be a positive number (got "${raw}").` });
        rowHasError = true;
        break;
      }

      let score: number | null = null;
      let benchmarkVersion: string | null = null;
      if (ageGroup && player.sex) {
        const benchmark = await findBenchmark(m.testCode, ageGroup, player.sex);
        if (benchmark) {
          score = scoreResult(value, benchmark.minBenchmark, benchmark.maxBenchmark, benchmark.lowerIsBetter);
          benchmarkVersion = benchmark.version;
        }
      }

      results.push({ metric: m.label, testCode: m.testCode, value, unit: m.unit, score, benchmarkVersion });
    }
    if (rowHasError) continue;

    try {
      await prisma.physicalTest.create({
        data: {
          playerId: player.id,
          testedAt,
          testedBy: (row.testedBy || "").trim() || staffUser?.name || null,
          ageGroup,
          results: { create: results },
        },
      });
      result.createdCount++;
    } catch {
      result.errors.push({ row: rowNum, message: "Failed to create physical test." });
    }
  }

  revalidatePath("/admin/physical-tests");
  return result;
}