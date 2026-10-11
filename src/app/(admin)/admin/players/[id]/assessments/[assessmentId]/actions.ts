"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AssessmentDomain } from "@prisma/client";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { DOMAINS, ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";

const ATTRS = ASSESSMENT_ATTRIBUTES as Record<string, string[]>;

async function loadAuthorized(assessmentId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const assessment = await prisma.developmentAssessment.findUnique({
    where: { id: assessmentId },
    include: { player: true },
  });
  if (!assessment) throw new Error("Assessment not found.");
  assertTeamAccess(accessibleTeamIds, assessment.player.teamId);
  return assessment;
}

export async function updateAssessment(assessmentId: string, formData: FormData) {
  const assessment = await loadAuthorized(assessmentId);

  const dateStr = String(formData.get("assessedAt") || "").trim();
  const assessedAt = dateStr ? new Date(dateStr) : assessment.assessedAt;
  if (isNaN(assessedAt.getTime())) throw new Error("Invalid assessment date.");

  const scores: { domain: AssessmentDomain; attribute: string; score: number }[] = [];
  for (const domain of DOMAINS) {
    for (const attribute of ATTRS[domain]) {
      const raw = String(formData.get(`score_${attribute}`) || "").trim();
      if (!raw) continue; // blank = not rated, never stored as zero

      const score = parseInt(raw, 10);
      if (isNaN(score) || score < 1 || score > 5) {
        throw new Error(`"${attribute}" must be a rating from 1 to 5.`);
      }
      scores.push({ domain: domain as AssessmentDomain, attribute, score });
    }
  }

  // Replace the old scores with the new set in one transaction, so a failure
  // can never leave an assessment half-edited.
  await prisma.$transaction([
    prisma.assessmentScore.deleteMany({ where: { assessmentId } }),
    prisma.developmentAssessment.update({
      where: { id: assessmentId },
      data: {
        assessedAt,
        summary: String(formData.get("summary") || "").trim() || null,
        nextGoals: String(formData.get("nextGoals") || "").trim() || null,
        scores: { create: scores },
      },
    }),
  ]);

  revalidatePath(`/admin/players/${assessment.playerId}/reports`);
  revalidatePath("/admin/assessments");
  redirect(`/admin/players/${assessment.playerId}/reports`);
}

export async function deleteAssessment(assessmentId: string) {
  const assessment = await loadAuthorized(assessmentId);

  // AssessmentScore rows are removed automatically (onDelete: Cascade).
  await prisma.developmentAssessment.delete({ where: { id: assessmentId } });

  revalidatePath(`/admin/players/${assessment.playerId}/reports`);
  revalidatePath("/admin/assessments");
  redirect(`/admin/players/${assessment.playerId}/reports`);
}