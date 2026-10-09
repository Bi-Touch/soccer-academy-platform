import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { createAssessment } from "../actions";
import { AssessmentForm } from "@/components/AssessmentForm";
import { playerName } from "@/lib/playerDisplay";

export default async function NewAssessmentPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const createWithId = createAssessment.bind(null, player.id);

  return (
    <div className="form-page">
      <Link href="/admin/assessments" style={{ fontSize: "0.9rem", opacity: 0.7 }}>
        &larr; All assessments
      </Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 4 }}>
        NEW ASSESSMENT
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>For {playerName(player)}</p>

      <AssessmentForm action={createWithId} />
    </div>
  );
}