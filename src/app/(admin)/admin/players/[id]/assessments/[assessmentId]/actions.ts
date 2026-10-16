"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AssessmentDomain } from "@prisma/client";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { DOMAINS, ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";
import { logAudit, diffFields } from "@/lib/audit";

const ATTRS = ASSESSMENT_ATTRIBUTES as Record<string, string[]>;

function dateKey(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

async function loadAuthorized(assessmentId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const assessment = await prisma.developmentAssessment.findUnique({
    where: { id: assessmentId },
    include: { player: true, scores: true },
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

  const summary = String(formData.get("summary") || "").trim() || null;
  const nextGoals = String(formData.get("nextGoals") || "").trim() || null;

  // Replace the old scores with the new set in one transaction, so a failure
  // can never leave an assessment half-edited.
  await prisma.$transaction([
    prisma.assessmentScore.deleteMany({ where: { assessmentId } }),
    prisma.developmentAssessment.update({
      where: { id: assessmentId },
      data: {
        assessedAt,
        summary,
        nextGoals,
        scores: { create: scores },
      },
    }),
  ]);

  // Compare every attribute that was rated before or after, so removed ratings show up too.
  const beforeScores = new Map(assessment.scores.map((s) => [s.attribute, s.score]));
  const afterScores = new Map(scores.map((s) => [s.attribute, s.score]));
  const allAttributes = [...new Set([...beforeScores.keys(), ...afterScores.keys()])];
  const scoreChanges = diffFields(
    Object.fromEntries(allAttributes.map((a) => [a, beforeScores.get(a) ?? null])),
    Object.fromEntries(allAttributes.map((a) => [a, afterScores.get(a) ?? null]))
  );

  const changes: Record<string, unknown> = {
    ...diffFields({ assessedAt: dateKey(assessment.assessedAt) }, { assessedAt: dateKey(assessedAt) }),
    ...scoreChanges,
  };
  // Summary and goals are free text about a minor's development, so only the fact they changed is logged.
  if ((assessment.summary ?? null) !== summary) changes.summary = "edited";
  if ((assessment.nextGoals ?? null) !== nextGoals) changes.nextGoals = "edited";

  // Saving with no actual changes is not logged, to keep the log free of noise.
  if (Object.keys(changes).length > 0) {
    await logAudit({
      action: "assessment.update",
      entityType: "DevelopmentAssessment",
      entityId: assessmentId,
      summary: `Updated assessment for ${assessment.player.name}`,
      changes,
    });
  }

  revalidatePath(`/admin/players/${assessment.playerId}/reports`);
  revalidatePath("/admin/assessments");
  redirect(`/admin/players/${assessment.playerId}/reports`);
}

export async function deleteAssessment(assessmentId: string) {
  const assessment = await loadAuthorized(assessmentId);

  // AssessmentScore rows are removed automatically (onDelete: Cascade).
  await prisma.developmentAssessment.delete({ where: { id: assessmentId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "assessment.delete",
    entityType: "DevelopmentAssessment",
    entityId: assessmentId,
    summary: `Deleted assessment for ${assessment.player.name}`,
    changes: {
      assessedAt: dateKey(assessment.assessedAt),
      scoresRemoved: assessment.scores.length,
    },
  });

  revalidatePath(`/admin/players/${assessment.playerId}/reports`);
  revalidatePath("/admin/assessments");
  redirect(`/admin/players/${assessment.playerId}/reports`);
}
