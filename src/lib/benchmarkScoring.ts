import { prisma } from "@/lib/prisma";

export type AgeGroup = "U11" | "U13" | "U15" | "U17";

/** Age-group cutoff is provisional — adjust the thresholds if your academy uses different bands. */
export function ageGroupForDate(dateOfBirth: Date, asOf: Date): AgeGroup {
  const age = Math.floor((asOf.getTime() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age <= 11) return "U11";
  if (age <= 13) return "U13";
  if (age <= 15) return "U15";
  return "U17";
}

/** Spec section 10 scoring formulas, clamped to 0–100. */
export function scoreResult(value: number, minBenchmark: number, maxBenchmark: number, lowerIsBetter: boolean): number {
  const raw = lowerIsBetter
    ? (100 * (maxBenchmark - value)) / (maxBenchmark - minBenchmark)
    : (100 * (value - minBenchmark)) / (maxBenchmark - minBenchmark);
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

export async function findBenchmark(testCode: string, ageGroup: string, sex: "MALE" | "FEMALE") {
  return prisma.benchmarkConfig.findFirst({
    where: { testCode, ageGroup, sex },
    orderBy: { createdAt: "desc" }, // latest configured version wins
  });
}