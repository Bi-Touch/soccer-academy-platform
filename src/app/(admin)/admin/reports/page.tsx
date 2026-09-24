import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { ReportTabs } from "@/components/ReportTabs";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 20,
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT_EXCUSED: "Absent (excused)",
  ABSENT_UNEXCUSED: "Absent (unexcused)",
  INJURED: "Injured",
};

export default async function ReportsHubPage({ searchParams }: { searchParams: { teamId?: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
    include: { players: { include: { user: true } } },
  });

  const activeTeamId = searchParams.teamId ?? teams[0]?.id;
  const activeTeam = teams.find((t) => t.id === activeTeamId);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TEAM REPORTS</h1>
      <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
        Squad-level rollups built from the data logged for individual players.
      </p>

      {teams.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/admin/reports?teamId=${t.id}`}
              style={{fontSize: "0.85rem", padding: "8px 16px", textDecoration: "none", borderRadius: 4,
                     ...(t.id === activeTeamId
                     ? { background: "var(--floodlight)", color: "var(--pitch-dark)", fontWeight: 600 }
                     : { background: "transparent", color: "var(--pitch)", border: "1.5px solid #e3ded2" }),
                    }}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      {!activeTeam ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No team available.</p>
      ) : (
        <ReportTabs
          attendance={await renderAttendance(activeTeam.id, activeTeam.players.length)}
          assessments={await renderAssessments(activeTeam.id, activeTeam.players)}
          physical={await renderPhysical(activeTeam.id, activeTeam.players)}
          matches={await renderMatches(activeTeam.id)}
        />
      )}
    </div>
  );
}

async function renderAttendance(teamId: string, squadSize: number) {
  const events = await prisma.scheduleEvent.findMany({
    where: { teamId, type: { in: ["TRAINING", "DRILL"] } },
    include: { attendance: true },
    orderBy: { startsAt: "asc" },
    take: 12,
  });

  const sessions = events
    .filter((e) => e.attendance.length > 0)
    .map((e) => {
      const attendedCount = e.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const rated = e.attendance.filter((a) => a.rating !== null);
      const avgRating = rated.length > 0 ? rated.reduce((sum, a) => sum + (a.rating ?? 0), 0) / rated.length : null;
      return { id: e.id, title: e.title, startsAt: e.startsAt, attendedCount, avgRating };
    });

  if (sessions.length === 0) {
    return <p style={{ opacity: 0.7 }}>No logged training sessions for this team yet.</p>;
  }

  const attendanceChartData = sessions.map((s) => ({
    label: s.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: squadSize > 0 ? Math.round((s.attendedCount / squadSize) * 100) : 0,
  }));

  const ratingChartData = sessions
    .filter((s) => s.avgRating !== null)
    .map((s) => ({
      label: s.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: s.avgRating ?? 0,
    }));

  return (
    <>
      <div className="report-grid">
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            ATTENDANCE RATE PER SESSION
          </h2>
          <ChartLegend items={[{ color: "var(--card-orange, #E8A33D)", label: "% of squad present" }]} />
          <BarChart data={attendanceChartData} orientation="vertical" height={160} color="var(--card-orange, #E8A33D)" max={100} unit="%" />
        </div>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            AVERAGE RATING PER SESSION
          </h2>
          <ChartLegend items={[{ color: "var(--card-red)", label: "Avg. coach rating (out of 5)" }]} />
          {ratingChartData.length > 0 ? (
            <BarChart data={ratingChartData} orientation="vertical" height={160} color="var(--card-red)" max={5} />
          ) : (
            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No ratings recorded yet.</p>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        SESSION BY SESSION
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Session</th>
              <th style={{ padding: "12px 16px" }}>Attended</th>
              <th style={{ padding: "12px 16px" }}>Avg. rating</th>
            </tr>
          </thead>
          <tbody>
            {[...sessions].reverse().map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                <td style={{ padding: "10px 16px" }}>{s.startsAt.toLocaleDateString()}</td>
                <td style={{ padding: "10px 16px" }}>{s.title}</td>
                <td style={{ padding: "10px 16px" }}>{s.attendedCount}/{squadSize}</td>
                <td style={{ padding: "10px 16px" }}>{s.avgRating !== null ? s.avgRating.toFixed(1) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function renderAssessments(teamId: string, players: { id: string; user: { name: string } }[]) {
  type PlayerRow = { playerId: string; name: string; assessedAt: Date; domainAverages: Record<string, number> };
  const rows: PlayerRow[] = [];

  for (const player of players) {
    const latest = await prisma.developmentAssessment.findFirst({
      where: { playerId: player.id },
      orderBy: { assessedAt: "desc" },
      include: { scores: true },
    });
    if (!latest) continue;

    const byDomain: Record<string, number[]> = { TECHNICAL: [], TACTICAL: [], PHYSICAL: [], MENTAL: [] };
    for (const s of latest.scores) byDomain[s.domain]?.push(s.score);
    const domainAverages: Record<string, number> = {};
    for (const domain of DOMAINS) {
      const vals = byDomain[domain];
      domainAverages[domain] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    }
    rows.push({ playerId: player.id, name: player.user.name, assessedAt: latest.assessedAt, domainAverages });
  }

  if (rows.length === 0) {
    return <p style={{ opacity: 0.7 }}>No assessments recorded for this team yet.</p>;
  }

  const squadAverages = DOMAINS.map((domain) => {
    const vals = rows.map((r) => r.domainAverages[domain]).filter((v) => v > 0);
    return {
      label: DOMAIN_LABELS[domain],
      value: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
    };
  });

  return (
    <>
      <div style={{ maxWidth: 720 }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            SQUAD AVERAGE &middot; LATEST ASSESSMENT PER PLAYER
          </h2>
          <ChartLegend items={[{ color: "var(--floodlight, #E8A33D)", label: "Avg. score (out of 5)" }]} />
          <BarChart data={squadAverages} orientation="vertical" height={160} color="var(--floodlight, #E8A33D)" max={5} />
        </div>
      </div>

      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        BY PLAYER
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Player</th>
              <th style={{ padding: "12px 8px" }}>Last assessed</th>
              <th style={{ padding: "12px 8px" }}>Technical</th>
              <th style={{ padding: "12px 8px" }}>Tactical</th>
              <th style={{ padding: "12px 8px" }}>Physical</th>
              <th style={{ padding: "12px 16px" }}>Mental</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime())
              .map((r) => (
                <tr key={r.playerId} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <Link href={`/admin/players/${r.playerId}/assessments`}>{r.name}</Link>
                  </td>
                  <td style={{ padding: "10px 8px" }}>{r.assessedAt.toLocaleDateString()}</td>
                  <td style={{ padding: "10px 8px" }}>{r.domainAverages.TECHNICAL || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{r.domainAverages.TACTICAL || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>{r.domainAverages.PHYSICAL || "—"}</td>
                  <td style={{ padding: "10px 16px" }}>{r.domainAverages.MENTAL || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function renderPhysical(teamId: string, players: { id: string; user: { name: string } }[]) {
  const latestValues: Record<string, { name: string; value: number }[]> = {};
  for (const m of PHYSICAL_TEST_METRICS) latestValues[m.key] = [];

  for (const player of players) {
    const latest = await prisma.physicalTest.findFirst({
      where: { playerId: player.id },
      orderBy: { testedAt: "desc" },
      include: { results: true },
    });
    if (!latest) continue;

    for (const m of PHYSICAL_TEST_METRICS) {
      const result = latest.results.find((r) => r.metric === m.label);
      if (result) latestValues[m.key].push({ name: player.user.name, value: result.value });
    }
  }

  const metricCharts: { metric: (typeof PHYSICAL_TEST_METRICS)[number]; data: { label: string; value: number }[] }[] = [];
  for (const m of PHYSICAL_TEST_METRICS) {
    const entries = latestValues[m.key];
    if (entries.length === 0) continue;
    const sorted = [...entries].sort((a, b) => (m.lowerIsBetter ? a.value - b.value : b.value - a.value));
    metricCharts.push({ metric: m, data: sorted.slice(0, 10).map((e) => ({ label: e.name, value: e.value })) });
  }

  if (metricCharts.length === 0) {
    return <p style={{ opacity: 0.7 }}>No physical tests recorded for this team yet.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
      {metricCharts.map(({ metric, data }) => (
        <div key={metric.key} style={cardStyle}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            {metric.label.toUpperCase()}
          </h2>
          <ChartLegend
            items={[{
              color: "var(--pitch)",
              label: `${metric.unit} · ${metric.lowerIsBetter ? "lower is better, best first" : "higher is better, best first"}`,
            }]}
          />
          <BarChart data={data} orientation="horizontal" color="var(--pitch)" />
        </div>
      ))}
    </div>
  );
}

async function renderMatches(teamId: string) {
  const performances = await prisma.matchPerformance.findMany({
    where: { event: { teamId } },
    include: { event: true, player: { include: { user: true } } },
    orderBy: { event: { startsAt: "asc" } },
  });

  if (performances.length === 0) {
    return <p style={{ opacity: 0.7 }}>No match stats logged for this team yet.</p>;
  }

  const matchMap = new Map<string, { label: string; goals: number }>();
  for (const p of performances) {
    const label = p.event.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const existing = matchMap.get(p.eventId) ?? { label, goals: 0 };
    existing.goals += p.goals;
    matchMap.set(p.eventId, existing);
  }
  const teamGoalsChart = [...matchMap.values()].map((m) => ({ label: m.label, value: m.goals }));

  const playerTotals = new Map<string, { name: string; goals: number; assists: number; minutesPlayed: number; matches: number; yellowCards: number; redCards: number }>();
  for (const p of performances) {
    const existing = playerTotals.get(p.playerId) ?? {
      name: p.player.user.name,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
    };
    existing.goals += p.goals;
    existing.assists += p.assists;
    existing.minutesPlayed += p.minutesPlayed;
    existing.matches += p.minutesPlayed > 0 ? 1 : 0;
    existing.yellowCards += p.yellowCards;
    existing.redCards += p.redCards;
    playerTotals.set(p.playerId, existing);
  }

  const squadRows = [...playerTotals.values()].sort((a, b) => b.goals - a.goals);
  const topScorersChart = squadRows.slice(0, 8).map((r) => ({ label: r.name, value: r.goals }));

  return (
    <>
      <div className="report-grid">
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            TEAM GOALS PER MATCH
          </h2>
          <ChartLegend items={[{ color: "var(--floodlight, #E8A33D)", label: "Goals scored" }]} />
          <BarChart data={teamGoalsChart} orientation="vertical" height={160} color="var(--floodlight, #E8A33D)" />
        </div>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            TOP SCORERS
          </h2>
          <ChartLegend items={[{ color: "var(--pitch)", label: "Goals this season" }]} />
          <BarChart data={topScorersChart} orientation="horizontal" color="var(--pitch)" />
        </div>
      </div>

      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        SQUAD TOTALS
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Player</th>
              <th style={{ padding: "12px 8px" }}>Matches</th>
              <th style={{ padding: "12px 8px" }}>Goals</th>
              <th style={{ padding: "12px 8px" }}>Assists</th>
              <th style={{ padding: "12px 8px" }}>Minutes</th>
              <th style={{ padding: "12px 16px" }}>Cards</th>
            </tr>
          </thead>
          <tbody>
            {squadRows.map((r) => (
              <tr key={r.name} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                <td style={{ padding: "10px 16px" }}>{r.name}</td>
                <td style={{ padding: "10px 8px" }}>{r.matches}</td>
                <td style={{ padding: "10px 8px" }}>{r.goals}</td>
                <td style={{ padding: "10px 8px" }}>{r.assists}</td>
                <td style={{ padding: "10px 8px" }}>{r.minutesPlayed}</td>
                <td style={{ padding: "10px 16px" }}>{r.yellowCards}Y / {r.redCards}R</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}