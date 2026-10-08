import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { ReportTabs } from "@/components/ReportTabs";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { MATCH_STAT_GROUPS } from "@/lib/matchStats";
import { playerName } from "@/lib/playerDisplay";

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

export default async function PlayerReportsPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
if (!player) return notFound();
if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
  return notFound();
}

const activeInjuries = await prisma.injuryRecord.findMany({
  where: { playerId: player.id, status: "ACTIVE" },
  orderBy: { dateOccurred: "desc" },
});

const [trainingCount, assessmentsCount, physicalCount, matchesCount] = await Promise.all([
    prisma.trainingAttendance.count({ where: { playerId: player.id } }),
    prisma.developmentAssessment.count({ where: { playerId: player.id } }),
    prisma.physicalTest.count({ where: { playerId: player.id } }),
    prisma.matchPerformance.count({ where: { playerId: player.id } }),
  ]);

  const defaultActive =
    trainingCount > 0 ? "attendance" :
    assessmentsCount > 0 ? "assessments" :
    physicalCount > 0 ? "physical" :
    matchesCount > 0 ? "matches" :
    "attendance";

    return (
    <div>
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {playerName(player).toUpperCase()} — REPORTS
      </h1> 
        
        <Link href={`/admin/players/${player.id}/development-index`} style={{ fontSize: "0.9rem" }}>View Development Index &rarr;</Link>

        {activeInjuries.length > 0 && (
          < div style={{ background: "#fdecec", border: "1px solid var(--card-red)", borderRadius: 8, padding: 16, margin: "16px 0", }}>
        {activeInjuries.map((i) => (
          <p key={i.id} style={{ fontSize: "0.9rem", margin: "4px 0" }}>
          🚑 <strong>{i.injuryType}</strong> since{" "}
          {i.dateOccurred.toLocaleDateString()}
          {i.expectedReturnDate &&
          ` · expected back ${i.expectedReturnDate.toLocaleDateString()}`}
          </p>
        ))}

        <Link href={`/admin/players/${player.id}/injuries/new`} style={{ fontSize: "0.85rem" }}> Log another injury </Link>
    </div>
    )}
      
      <ReportTabs
        defaultActive={defaultActive}
        labels={{
          attendance: { title: "Training", body: "Attendance rate, coach ratings, and full session history." },
          assessments: { title: "Assessments", body: "Development scores across technical, tactical, physical, and mental domains." },
          physical: { title: "Physical Tests", body: "Trend charts for every recorded fitness metric." },
          matches: { title: "Match Stats", body: "Goals, assists, passing accuracy, and defensive actions per match." },
        }}
        attendance={await renderTraining(player.id)}
        assessments={await renderAssessments(player.id)}
        physical={await renderPhysical(player.id)}
        matches={await renderMatches(player.id)}
      />
    </div>
  );
}

async function renderTraining(playerId: string) {
  const records = await prisma.trainingAttendance.findMany({
    where: { playerId },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  if (records.length === 0) {
    return <p style={{ opacity: 0.7 }}>No training sessions logged for this player yet.</p>;
  }

  const total = records.length;
  const attendedCount = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const attendanceRate = Math.round((attendedCount / total) * 100);

  const ratedRecords = records.filter((r) => r.rating !== null);
  const avgRating = ratedRecords.length > 0
    ? (ratedRecords.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedRecords.length).toFixed(1)
    : "—";

  const statusCounts: Record<string, number> = {};
  for (const r of records) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

  const ratingChartData = ratedRecords.slice(-10).map((r) => ({
    label: r.event.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: r.rating ?? 0,
  }));

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    label: STATUS_LABELS[status] ?? status,
    value: count,
  }));

  return (
    <>
      <div className="stat-summary-grid">
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 16 }}>
          <div className="display" style={{ fontSize: "1.6rem" }}>{total}</div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Sessions logged</div>
        </div>
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 16 }}>
          <div className="display" style={{ fontSize: "1.6rem" }}>{attendanceRate}%</div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Attendance rate</div>
        </div>
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 16 }}>
          <div className="display" style={{ fontSize: "1.6rem" }}>{avgRating}</div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Avg. session rating</div>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: 32 }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            RATING — LAST {ratingChartData.length} RATED SESSIONS
          </h2>
          {ratingChartData.length > 0 ? (
            <>
              <ChartLegend items={[{ color: "var(--card-red)", label: "Coach rating (out of 5)" }]} />
              <BarChart data={ratingChartData} orientation="vertical" height={160} color="var(--card-red)" max={5} />
            </>
          ) : (
            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No ratings recorded yet.</p>
          )}
        </div>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            ATTENDANCE BREAKDOWN
          </h2>
          <ChartLegend items={[{ color: "var(--floodlight, #E8A33D)", label: "Sessions by status" }]} />
          <BarChart data={statusChartData} orientation="horizontal" color="var(--floodlight, #E8A33D)" />
        </div>
      </div>

      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        SESSION HISTORY
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Session</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Rating</th>
              <th style={{ padding: "12px 16px" }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                <td style={{ padding: "10px 16px" }}>{r.event.startsAt.toLocaleDateString()}</td>
                <td style={{ padding: "10px 16px" }}>{r.event.title}</td>
                <td style={{ padding: "10px 16px" }}>{STATUS_LABELS[r.status] ?? r.status}</td>
                <td style={{ padding: "10px 16px" }}>{r.rating ?? "—"}</td>
                <td style={{ padding: "10px 16px", opacity: 0.75 }}>{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function renderAssessments(playerId: string) {
  const assessments = await prisma.developmentAssessment.findMany({
    where: { playerId },
    include: { scores: true },
    orderBy: { assessedAt: "desc" },
  });

  if (assessments.length === 0) {
    return <p style={{ opacity: 0.7 }}>No assessments recorded yet. Log one from Operations → Assessments.</p>;
  }

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
    <>
      <div style={{ maxWidth: 720 }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            LATEST DOMAIN AVERAGES &middot; {latest.assessedAt.toLocaleDateString()}
          </h2>
          <ChartLegend items={[{ color: "var(--card-orange, #E8A33D)", label: "Avg. score (out of 5)" }]} />
          <BarChart data={domainAverages(latest.scores)} orientation="vertical" height={160} color="var(--card-orange, #E8A33D)" max={5} />
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
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
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
                    <Link href={`/admin/players/${playerId}/assessments/${a.id}`}>{a.assessedAt.toLocaleDateString()}</Link>
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
  );
}

async function renderPhysical(playerId: string) {
  const tests = await prisma.physicalTest.findMany({
    where: { playerId },
    include: { results: true },
    orderBy: { testedAt: "asc" },
  });

  if (tests.length === 0) {
    return <p style={{ opacity: 0.7 }}>No physical tests recorded yet. Log one from Operations → Physical Tests.</p>;
  }

  const metricSeries = PHYSICAL_TEST_METRICS.map((m) => {
    const points = tests
      .map((t) => {
        const result = t.results.find((r) => r.metric === m.label);
        return {
          label: t.testedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          value: result?.value,
          score: result?.score ?? null,
        };
      })
      .filter((p): p is { label: string; value: number; score: number | null } => p.value !== undefined);
    return { metric: m, points };
  }).filter((s) => s.points.length > 0);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {metricSeries.map(({ metric, points }) => {
          const latest = points.at(-1);
          return (
            <div key={metric.key} style={cardStyle}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                {metric.label.toUpperCase()}
              </h2>
              {latest && (
                latest.score != null ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--pitch)", fontWeight: 600, marginBottom: 4 }}>
                    Latest score: {latest.score}/100
                  </p>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "var(--card-red)", marginBottom: 4 }}>
                    Not enough data to score (missing benchmark, sex, or date of birth)
                  </p>
                )
              )}
              <ChartLegend
                items={[{
                  color: "var(--pitch)",
                  label: `${metric.unit} · ${metric.lowerIsBetter ? "lower is better" : "higher is better"}`,
                }]}
              />
              <BarChart data={points} orientation="vertical" height={130} color="var(--pitch)" />
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        FULL HISTORY
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Tested by</th>
              {PHYSICAL_TEST_METRICS.map((m) => (
                <th key={m.key} style={{ padding: "12px 8px" }}>{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...tests].reverse().map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                <td style={{ padding: "10px 16px" }}>{t.testedAt.toLocaleDateString()}</td>
                <td style={{ padding: "10px 16px" }}>{t.testedBy ?? "—"}</td>
                {PHYSICAL_TEST_METRICS.map((m) => {
                  const r = t.results.find((res) => res.metric === m.label);
                  return (
                    <td key={m.key} style={{ padding: "10px 8px" }}>
                      {r ? `${r.value}${r.unit === "level" ? "" : ` ${r.unit}`}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function renderMatches(playerId: string) {
  const performances = await prisma.matchPerformance.findMany({
    where: { playerId },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  if (performances.length === 0) {
    return <p style={{ opacity: 0.7 }}>No match stats recorded for this player yet.</p>;
  }

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

  const labels = performances.map((p) => p.event.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }));

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

      <div className="chart-grid-3" style={{ marginTop: 32 }}>
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
  );
}