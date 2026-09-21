"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { ASSESSMENT_ATTRIBUTES, attributeSlug } from "@/lib/assessmentAttributes";

export async function createAssessment(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
  const assessedAtRaw = String(formData.get("assessedAt") || "");
  const summary = String(formData.get("summary") || "").trim() || null;
  const nextGoals = String(formData.get("nextGoals") || "").trim() || null;

  const scores: { domain: "TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL"; attribute: string; score: number }[] = [];

  for (const [domain, attributes] of Object.entries(ASSESSMENT_ATTRIBUTES) as [
    "TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL",
    string[]
  ][]) {
    for (const attribute of attributes) {
      const raw = String(formData.get(`score_${domain}_${attributeSlug(attribute)}`) || "");
      if (raw) {
        scores.push({ domain, attribute, score: parseInt(raw, 10) });
      }
    }
  }

  await prisma.developmentAssessment.create({
    data: {
      playerId,
      assessedAt: assessedAtRaw ? new Date(assessedAtRaw) : new Date(),
      assessedBy: staffUser?.name ?? null,
      summary,
      nextGoals,
      scores: { create: scores },
    },
  });

  revalidatePath(`/admin/players/${playerId}/assessments`);
  redirect(`/admin/players/${playerId}/assessments`);
}