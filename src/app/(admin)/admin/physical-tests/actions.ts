"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { toCsv } from "@/lib/csv";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { playerName } from "@/lib/playerDisplay";

export async function exportPhysicalTests(): Promise<string> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const tests = await prisma.physicalTest.findMany({
    where: accessibleTeamIds ? { player: { teamId: { in: accessibleTeamIds } } } : undefined,
    include: { player: { include: { user: true, team: true } }, results: true },
    orderBy: { testedAt: "desc" },
  });

  const headers = ["team", "testDate", "player", "playerEmail", "testedBy", ...PHYSICAL_TEST_METRICS.map((m) => m.label)];
  const rows = tests.map((t) => [
    t.player.team?.name ?? "",
    t.testedAt.toISOString().slice(0, 10),
    playerName(t.player),
    t.player.user?.email ?? "",
    t.testedBy ?? "",
    ...PHYSICAL_TEST_METRICS.map((m) => t.results.find((r) => r.metric === m.label)?.value.toString() ?? ""),
  ]);

  return toCsv(headers, rows);
}