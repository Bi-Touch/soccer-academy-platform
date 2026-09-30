"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { ageGroupForDate, findBenchmark, scoreResult } from "@/lib/benchmarkScoring";

export async function createPhysicalTest(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });

  const dateStr = String(formData.get("testedAt") || "").trim() || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999`);
  if (isNaN(dayStart.getTime())) {
    throw new Error(`Invalid test date "${dateStr}".`);
  }

  const ageGroup = player.dateOfBirth ? ageGroupForDate(player.dateOfBirth, dayStart) : null;

  const values: {
    metric: string;
    testCode: string;
    value: number;
    unit: string;
    score: number | null;
    benchmarkVersion: string | null;
  }[] = [];

  for (const m of PHYSICAL_TEST_METRICS) {
    const raw = String(formData.get(`value_${m.key}`) || "").trim();
    if (!raw) continue; // blank = not tested, never saved as zero

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`"${m.label}" must be a valid non-negative number.`);
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

  // Find-or-create the day's test, then upsert each metric — same rule the
  // CSV importer follows, so a manual entry and an imported row for the same
  // player and date always land on one record instead of two.
  let test = await prisma.physicalTest.findFirst({
    where: { playerId, testedAt: { gte: dayStart, lte: dayEnd } },
  });

  if (!test) {
    test = await prisma.physicalTest.create({
      data: {
        playerId,
        testedAt: dayStart,
        testedBy: staffUser?.name ?? null,
        ageGroup,
      },
    });
  } else {
    test = await prisma.physicalTest.update({
      where: { id: test.id },
      data: {
        testedBy: staffUser?.name ?? test.testedBy ?? null,
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

  revalidatePath(`/admin/players/${playerId}/reports`);
  revalidatePath("/admin/physical-tests");
  redirect(`/admin/players/${playerId}/reports`);
}