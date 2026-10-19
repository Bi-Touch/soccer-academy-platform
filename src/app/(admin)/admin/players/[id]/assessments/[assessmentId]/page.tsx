import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS } from "@/lib/assessmentAttributes";
import { playerName } from "@/lib/playerDisplay";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteAssessment } from "./actions";

export default async function AssessmentDetailPage(props: { params: Promise<{ id: string; assessmentId: string }> }) {
  const params = await props.params;
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

  const deleteWithId = deleteAssessment.bind(null, assessment.id);

  return (
    <div>
      <Link href={`/admin/players/${player.id}/reports`} style={{ fontSize: "0.9rem", opacity: 0.7 }}>
        &larr; Back to reports
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        <div>
          <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>
            {playerName(player).toUpperCase()}
          </h1>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: 4 }}>
            {assessment.assessedAt.toLocaleDateString()}
            {assessment.assessedBy ? ` · ${assessment.assessedBy}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href={`/admin/players/${player.id}/assessments/${assessment.id}/edit`} className="button outline" style={{ fontSize: "0.85rem" }}>
            Edit
          </Link>
          <form action={deleteWithId}>
            <ConfirmSubmitButton
              message="Delete this assessment? This cannot be undone."
              style={{ background: "none", border: "1px solid var(--card-red)", color: "var(--card-red)", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {assessment.summary && (
        <p style={{ marginTop: 20, maxWidth: 600, lineHeight: 1.6 }}>{assessment.summary}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 32, maxWidth: 640 }}>
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