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

  const file = formData.get("file") as File | null;
  if (!file) {
    return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "No file uploaded." }] };
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return { createdCount: 0, updatedCount: 0, errors: [{ row: 0, message: "The CSV file contains no data rows." }] };
  }

  const [teams, staffUser] = await Promise.all([
    prisma.team.findMany({
      where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
      include: { players: { include: { user: true } } },
    }),
    prisma.user.findUnique({ where: { id: user.id } }),
  ]);

  const teamByName = new Map(teams.map((t) => [t.name.trim().toLowerCase(), t]));

  const result: ImportResult = { createdCount: 0, updatedCount: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    // --- Team ---
    const teamName = (row.team || "").trim();
    if (!teamName) {
      result.errors.push({ row: rowNum, message: "Missing team." });
      continue;
    }
    const team = teamByName.get(teamName.toLowerCase());
    if (!team) {
      result.errors.push({ row: rowNum, message: `Team "${teamName}" not found or not accessible.` });
      continue;
    }

    // --- Player: match by email when the player has a login, otherwise by
    // name (players registered by a parent/guardian have no email/login). ---
    const email = (row.playerEmail || "").trim().toLowerCase();
    const nameRaw = (row.player || "").trim();

    let player = email ? team.players.find((p) => p.user?.email?.trim().toLowerCase() === email) : undefined;

    if (!player && nameRaw) {
      player = team.players.find((p) => playerName(p).trim().toLowerCase() === nameRaw.toLowerCase());
    }

    if (!player) {
      if (!email && !nameRaw) {
        result.errors.push({ row: rowNum, message: "Provide either playerEmail or player (name) to identify the player." });
      } else {
        result.errors.push({
          row: rowNum,
          message: `Player not found on team "${team.name}" (looked up by ${email ? `email "${email}"` : `name "${nameRaw}"`}).`,
        });
      }
      continue;
    }

    // --- Date ---
    const dateStr = (row.testDate || "").trim();
    if (!dateStr) {
      result.errors.push({ row: rowNum, message: "Missing testDate." });
      continue;
    }
    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999`);
    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid testDate "${dateStr}". Expected format YYYY-MM-DD.` });
      continue;
    }

    // --- Metrics, matched by human-readable label (CSV headers use labels, e.g. "10m Sprint") ---
    const ageGroup = player.dateOfBirth ? ageGroupForDate(player.dateOfBirth, dayStart) : null;

    const values: {
      metric: string;
      testCode: string;
      value: number;
      unit: string;
      score: number | null;
      benchmarkVersion: string | null;
    }[] = [];
    let rowHasError = false;

    for (const m of PHYSICAL_TEST_METRICS) {
      const raw = (row[m.label] || "").trim();
      if (!raw) continue; // blank = not tested, never saved as zero

      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        result.errors.push({ row: rowNum, message: `"${m.label}" must be a valid non-negative number (got "${raw}").` });
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

      values.push({ metric: m.label, testCode: m.testCode, value, unit: m.unit, score, benchmarkVersion });
    }
    if (rowHasError) continue;

    if (values.length === 0) {
      result.errors.push({ row: rowNum, message: "No metric values provided in this row." });
      continue;
    }

    // --- Find-or-create the day's test, then upsert each metric. ---
    // NOTE: this means re-importing a CSV for the same player+day updates
    // that day's test rather than creating a second one — intentional for
    // idempotent re-imports, but it also means two genuinely separate
    // same-day sessions (e.g. AM/PM) will merge into a single record.
    try {
      let test = await prisma.physicalTest.findFirst({
        where: { playerId: player.id, testedAt: { gte: dayStart, lte: dayEnd } },
      });
      const existed = Boolean(test);

      if (!test) {
        test = await prisma.physicalTest.create({
          data: {
            playerId: player.id,
            testedAt: dayStart,
            testedBy: (row.testedBy || "").trim() || staffUser?.name || null,
            ageGroup,
          },
        });
      } else {
        test = await prisma.physicalTest.update({
          where: { id: test.id },
          data: {
            testedBy: (row.testedBy || "").trim() || test.testedBy || staffUser?.name || null,
            ageGroup,
          },
        });
      }

      for (const v of values) {
        await prisma.physicalTestResult.upsert({
          where: { testId_metric: { testId: test.id, metric: v.metric } },
          create: {
            testId: test.id,
            metric: v.metric,
            testCode: v.testCode,
            value: v.value,
            unit: v.unit,
            score: v.score,
            benchmarkVersion: v.benchmarkVersion,
          },
          update: {
            testCode: v.testCode,
            value: v.value,
            unit: v.unit,
            score: v.score,
            benchmarkVersion: v.benchmarkVersion,
          },
        });
      }

      if (existed) result.updatedCount++;
      else result.createdCount++;

      revalidatePath(`/admin/players/${player.id}/reports`);
    } catch (error) {
      console.error(`Failed to import physical test on CSV row ${rowNum}:`, error);
      result.errors.push({ row: rowNum, message: "Failed to create or update physical test." });
    }
  }

  revalidatePath("/admin/physical-tests");
  revalidatePath("/admin/reports");

  return result;
}