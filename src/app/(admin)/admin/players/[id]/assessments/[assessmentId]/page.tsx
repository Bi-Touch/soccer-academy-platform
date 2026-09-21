import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS } from "@/lib/assessmentAttributes";

export default async function AssessmentDetailPage({ params }: { params: { id: string; assessmentId: string } }) {
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

  return (
    <div>
      <Link href={`/admin/players/${player.id}/assessments`} style={{ fontSize: "0.9rem", opacity: 0.7 }}>
        &larr; All assessments
      </Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {player.user.name.toUpperCase()}
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: 4 }}>
        {assessment.assessedAt.toLocaleDateString()}
        {assessment.assessedBy ? ` · ${assessment.assessedBy}` : ""}
      </p>

      {assessment.summary && (
        <p style={{ marginTop: 20, maxWidth: 600, lineHeight: 1.6 }}>{assessment.summary}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32, maxWidth: 640 }}>
        {DOMAINS.map((domain) => {
          const domainScores = assessment.scores.filter((s) => s.domain === domain);
          if (domainScores.length === 0) return null;
          return (
            <div key={domain} style={{ background: "white", borderLeft: `4px solid ${DOMAIN_COLORS[domain]}`, padding: 16 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 10 }}>
                {DOMAIN_LABELS[domain]}
              </h3>
              {domainScores.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "4px 0" }}>
                  <span style={{ opacity: 0.8 }}>{s.attribute}</span>
                  <strong>{s.score}/5</strong>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {assessment.nextGoals && (
        <div style={{ marginTop: 32, maxWidth: 600 }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
            GOALS FOR NEXT PERIOD
          </h3>
          <p style={{ lineHeight: 1.6 }}>{assessment.nextGoals}</p>
        </div>
      )}
    </div>
  );
}