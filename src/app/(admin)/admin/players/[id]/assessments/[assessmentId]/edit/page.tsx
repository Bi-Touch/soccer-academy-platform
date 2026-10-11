import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { AssessmentEditForm } from "@/components/AssessmentEditForm";
import { updateAssessment } from "../actions";

export default async function EditAssessmentPage({ params }: { params: { id: string; assessmentId: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const assessment = await prisma.developmentAssessment.findUnique({
    where: { id: params.assessmentId },
    include: { scores: true },
  });
  if (!assessment || assessment.playerId !== player.id) return notFound();

  const scores: Record<string, number> = {};
  for (const s of assessment.scores) scores[s.attribute] = s.score;

  const updateWithId = updateAssessment.bind(null, assessment.id);

  return (
    <div className="form-page">
      <Link href={`/admin/players/${player.id}/assessments/${assessment.id}`} style={{ fontSize: "0.9rem", opacity: 0.7 }}>
        &larr; Back to assessment
      </Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 4 }}>
        EDIT ASSESSMENT
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>For {playerName(player)}</p>

      <AssessmentEditForm
        action={updateWithId}
        defaults={{
          assessedAt: assessment.assessedAt.toISOString().slice(0, 10),
          summary: assessment.summary ?? "",
          nextGoals: assessment.nextGoals ?? "",
          scores,
        }}
      />
    </div>
  );
}