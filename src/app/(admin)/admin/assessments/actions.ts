"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { toCsv } from "@/lib/csv";
import { ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";
import { playerName } from "@/lib/playerDisplay";

export async function exportAssessments(): Promise<string> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const assessments = await prisma.developmentAssessment.findMany({
    where: accessibleTeamIds ? { player: { teamId: { in: accessibleTeamIds } } } : undefined,
    include: { player: { include: { user: true, team: true } }, scores: true },
    orderBy: { assessedAt: "desc" },
  });

  const attrNames = Object.values(ASSESSMENT_ATTRIBUTES).flat();
  const headers = ["team", "player", "playerEmail", "date", "assessedBy", "summary", "nextGoals", ...attrNames];
  const rows = assessments.map((a) => {
    const byAttr = new Map(a.scores.map((s) => [s.attribute, s.score.toString()]));
    return [
      a.player.team?.name ?? "",
      playerName(a.player),
      a.player.user?.email ?? "",
      a.assessedAt.toISOString().slice(0, 10),
      a.assessedBy ?? "",
      a.summary ?? "",
      a.nextGoals ?? "",
      ...attrNames.map((attr) => byAttr.get(attr) ?? ""),
    ];
  });

  return toCsv(headers, rows);
}