import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { MATCH_STAT_GROUPS } from "@/lib/matchStats";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 20,
};

export default async function PlayerMatchStatsPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const performances = await prisma.matchPerformance.findMany({
    where: { playerId: params.id },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  const matchesPlayed = performances.filter((p) => p.minutesPlayed > 0).length;
  const totals = performances.reduce(
    (acc, p) => ({
      goals: acc.goals + p.goals,
      assists: acc.assists + p.assists,
      minutesPlayed: acc.minutesPlayed + p.minutesPlayed,
      yellowCards: acc.yellowCards + p.yellowCards,
      redCards: acc.redCards + p.redCards,
    }),
    { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0 }
  );

  const labels = performances.map((p) =>
    p.event.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  );

  const goalContributionSeries = [
    { name: "Goals", color: "var(--floodlight)", values: performances.map((p) => p.goals) },
    { name: "Assists", color: "var(--pitch)", values: performances.map((p) => p.assists) },
  ];

  const passingAccuracyData = performances.map((p, i) => ({
    label: labels[i],
    value: p.passesAttempted > 0 ? Math.round((p.passesCompleted / p.passesAttempted) * 100) : 0,
  }));

  const defensiveActionsData = performances.map((p, i) => ({
    label: labels[i],
    value: p.tackles + p.interceptions + p.recoveries,
  }));

  return (
    <div>
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {player.user.name.toUpperCase()} — MATCH STATS
      </h1>

      {performances.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No match stats recorded for this player yet.</p>
      ) : (
        <>
          <div className="stat-summary-grid">
            {[
              [matchesPlayed, "Matches"],
              [totals.goals, "Goals"],
              [totals.assists, "Assists"],
              [totals.minutesPlayed, "Minutes"],
              [`${totals.yellowCards}Y / ${totals.redCards}R`, "Cards"],
            ].map(([value, label]) => (
              <div key={label as string} style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 16 }}>
                <div className="display" style={{ fontSize: "1.6rem" }}>{value}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="chart-grid-3">
            <div style={cardStyle}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                GOAL CONTRIBUTIONS
              </h2>
              <GroupedBarChart labels={labels} series={goalContributionSeries} height={140} />
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                PASSING ACCURACY
              </h2>
              <ChartLegend items={[{ color: "var(--floodlight, #E8A33D)", label: "Passes completed (%)" }]} />
              <BarChart data={passingAccuracyData} orientation="vertical" height={140} color="var(--floodlight, #E8A33D)" max={100} unit="%" />
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                DEFENSIVE ACTIONS
              </h2>
              <ChartLegend items={[{ color: "var(--card-red)", label: "Tackles + interceptions + recoveries" }]} />
              <BarChart data={defensiveActionsData} orientation="vertical" height={140} color="var(--card-red)" />
            </div>
          </div>

          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
            FULL HISTORY
          </h2>
          <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.8rem" }}>
                  <th style={{ padding: "12px 16px" }}>Match</th>
                  {MATCH_STAT_GROUPS.flatMap((g) => g.fields).map((f) => (
                    <th key={f.key} style={{ padding: "12px 8px" }}>{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...performances].reverse().map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                    <td style={{ padding: "10px 16px" }}>
                      {p.event.startsAt.toLocaleDateString()}{p.event.opponent ? ` vs ${p.event.opponent}` : ""}
                    </td>
                    {MATCH_STAT_GROUPS.flatMap((g) => g.fields).map((f) => (
                      <td key={f.key} style={{ padding: "10px 8px" }}>
                        {(p as unknown as Record<string, number>)[f.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}