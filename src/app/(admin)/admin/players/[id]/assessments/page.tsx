import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { DOMAIN_LABELS } from "@/lib/assessmentAttributes";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 20,
};

export default async function AssessmentsPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const assessments = await prisma.developmentAssessment.findMany({
    where: { playerId: params.id },
    include: { scores: true },
    orderBy: { assessedAt: "desc" },
  });

  const latest = assessments[0];

  function domainAverages(scores: { domain: string; score: number }[]) {
    const byDomain: Record<string, number[]> = { TECHNICAL: [], TACTICAL: [], PHYSICAL: [], MENTAL: [] };
    for (const s of scores) byDomain[s.domain]?.push(s.score);
    return Object.entries(byDomain).map(([domain, vals]) => ({
      label: DOMAIN_LABELS[domain],
      value: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
    }));
  }

  return (
    <div>
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>
          {player.user.name.toUpperCase()} — ASSESSMENTS
        </h1>
        <Link href={`/admin/players/${player.id}/assessments/new`} className="button">+ New Assessment</Link>
      </div>

      {assessments.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No assessments recorded yet.</p>
      ) : (
        <>
          <div style={{ marginTop: 32, maxWidth: 720 }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                LATEST DOMAIN AVERAGES &middot; {latest.assessedAt.toLocaleDateString()}
              </h2>
              <ChartLegend items={[{ color: "var(--card-orange, #E8A33D)", label: "Avg. score (out of 5)" }]} />
              <BarChart
                data={domainAverages(latest.scores)}
                orientation="vertical"
                height={160}
                color="var(--card-orange, #E8A33D)"
                max={5}
              />
            </div>
          </div>

          {latest.summary && (
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>Summary</p>
              <p style={{ marginTop: 4, fontSize: "0.9rem" }}>{latest.summary}</p>
            </div>
          )}
          {latest.nextGoals && (
            <div style={{ ...cardStyle, marginTop: 12 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>Goals for next period</p>
              <p style={{ marginTop: 4, fontSize: "0.9rem" }}>{latest.nextGoals}</p>
            </div>
          )}

          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
            HISTORY
          </h2>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Assessed by</th>
                  <th style={{ padding: "12px 16px" }}>Technical</th>
                  <th style={{ padding: "12px 16px" }}>Tactical</th>
                  <th style={{ padding: "12px 16px" }}>Physical</th>
                  <th style={{ padding: "12px 16px" }}>Mental</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const avgs = domainAverages(a.scores);
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <Link href={`/admin/players/${player.id}/assessments/${a.id}`}>
                          {a.assessedAt.toLocaleDateString()}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 16px" }}>{a.assessedBy ?? "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{avgs[0].value || "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{avgs[1].value || "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{avgs[2].value || "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{avgs[3].value || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}