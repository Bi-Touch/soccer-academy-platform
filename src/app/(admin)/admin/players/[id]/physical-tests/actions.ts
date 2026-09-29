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
  const testedAtRaw = String(formData.get("testedAt") || "");
  const testedAt = testedAtRaw ? new Date(testedAtRaw) : new Date();

  const ageGroup = player.dateOfBirth ? ageGroupForDate(player.dateOfBirth, testedAt) : null;

  const results: {
    metric: string;
    testCode: string;
    value: number;
    unit: string;
    score: number | null;
    benchmarkVersion: string | null;
  }[] = [];

  for (const m of PHYSICAL_TEST_METRICS) {
    const raw = String(formData.get(`value_${m.key}`) || "").trim();
    if (!raw) continue;
    const value = parseFloat(raw);

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

  await prisma.physicalTest.create({
    data: {
      playerId,
      testedAt,
      testedBy: staffUser?.name ?? null,
      ageGroup,
      results: { create: results },
    },
  });

  revalidatePath(`/admin/players/${playerId}/reports`);
  redirect(`/admin/players/${playerId}/reports`);
}