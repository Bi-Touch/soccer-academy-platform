
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { GroupedBarChart } from "@/components/GroupedBarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { ReportTabs } from "@/components/ReportTabs";
import { DOMAIN_LABELS } from "@/lib/assessmentAttributes";
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

export default async function ParentPlayerReportsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const guardian = await prisma.parentGuardian.findUnique({
    where: { userId: session.user.id },
  });

  if (!guardian) {
    return notFound();
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
  });

  if (!player || player.parentGuardianId !== guardian.id) {
    return notFound();
  }

  const [trainingCount, assessmentsCount, physicalCount, matchesCount] =
    await Promise.all([
      prisma.trainingAttendance.count({
        where: { playerId: player.id },
      }),
      prisma.developmentAssessment.count({
        where: { playerId: player.id },
      }),
      prisma.physicalTest.count({
        where: { playerId: player.id },
      }),
      prisma.matchPerformance.count({
        where: { playerId: player.id },
      }),
    ]);

  const defaultActive =
    trainingCount > 0
      ? "attendance"
      : assessmentsCount > 0
        ? "assessments"
        : physicalCount > 0
          ? "physical"
          : matchesCount > 0
            ? "matches"
            : "attendance";

  return (
    <div>
      <Link
        href="/portal/parent"
        style={{ fontSize: "0.9rem", opacity: 0.7 }}
      >
        &larr; My Children
      </Link>

      <h1
        className="display"
        style={{
          fontSize: "2.2rem",
          color: "var(--pitch)",
          marginTop: 12,
        }}
      >
        {playerName(player).toUpperCase()} — DEVELOPMENT REPORTS
      </h1>

      <p style={{ opacity: 0.7, marginTop: 8 }}>
        View training attendance, development assessments, physical tests,
        match performance, and injury history.
      </p>

      <ReportTabs
        defaultActive={defaultActive}
        labels={{
          attendance: {
            title: "Training",
            body: "Attendance rate, coach ratings, and session history.",
          },
          assessments: {
            title: "Assessments",
            body: "Development scores across technical, tactical, physical, and mental domains.",
          },
          physical: {
            title: "Physical Tests",
            body: "Progress charts for recorded fitness metrics.",
          },
          matches: {
            title: "Match Stats",
            body: "Goals, assists, passing accuracy, and defensive actions per match.",
          },
          injuries: {
            title: "Injuries",
            body: "Injury history, recovery status, and return-to-play details.",
          },
        }}
        attendance={await renderTraining(player.id)}
        assessments={await renderAssessments(player.id)}
        physical={await renderPhysical(player.id)}
        matches={await renderMatches(player.id)}
        injuries={await renderInjuries(player.id)}
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
    return (
      <p style={{ opacity: 0.7 }}>
        No training sessions have been logged for this player yet.
      </p>
    );
  }

  const total = records.length;
  const attendedCount = records.filter(
    (record) =>
      record.status === "PRESENT" || record.status === "LATE",
  ).length;
  const attendanceRate = Math.round((attendedCount / total) * 100);

  const ratedRecords = records.filter(
    (record) => record.rating !== null,
  );

  const avgRating =
    ratedRecords.length > 0
      ? (
          ratedRecords.reduce(
            (sum, record) => sum + (record.rating ?? 0),
            0,
          ) / ratedRecords.length
        ).toFixed(1)
      : "—";

  const statusCounts: Record<string, number> = {};

  for (const record of records) {
    statusCounts[record.status] =
      (statusCounts[record.status] ?? 0) + 1;
  }

  const ratingChartData = ratedRecords.slice(-10).map((record) => ({
    label: record.event.startsAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    value: record.rating ?? 0,
  }));

  const statusChartData = Object.entries(statusCounts).map(
    ([status, count]) => ({
      label: STATUS_LABELS[status] ?? status,
      value: count,
    }),
  );

  return (
    <>
      <div className="stat-summary-grid">
        <div
          style={{
            background: "white",
            borderTop: "3px solid var(--floodlight)",
            padding: 16,
          }}
        >
          <div className="display" style={{ fontSize: "1.6rem" }}>
            {total}
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Sessions logged
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderTop: "3px solid var(--floodlight)",
            padding: 16,
          }}
        >
          <div className="display" style={{ fontSize: "1.6rem" }}>
            {attendanceRate}%
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Attendance rate
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderTop: "3px solid var(--floodlight)",
            padding: 16,
          }}
        >
          <div className="display" style={{ fontSize: "1.6rem" }}>
            {avgRating}
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Average session rating
          </div>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: 32 }}>
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            RATING — LAST {ratingChartData.length} RATED SESSIONS
          </h2>

          {ratingChartData.length > 0 ? (
            <>
              <ChartLegend
                items={[
                  {
                    color: "var(--card-red)",
                    label: "Coach rating (out of 5)",
                  },
                ]}
              />
              <BarChart
                data={ratingChartData}
                orientation="vertical"
                height={160}
                color="var(--card-red)"
                max={5}
              />
            </>
          ) : (
            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>
              No ratings recorded yet.
            </p>
          )}
        </div>

        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            ATTENDANCE BREAKDOWN
          </h2>

          <ChartLegend
            items={[
              {
                color: "var(--floodlight, #E8A33D)",
                label: "Sessions by status",
              },
            ]}
          />

          <BarChart
            data={statusChartData}
            orientation="horizontal"
            color="var(--floodlight, #E8A33D)"
          />
        </div>
      </div>

      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--pitch)",
          marginTop: 40,
          marginBottom: 12,
        }}
      >
        SESSION HISTORY
      </h2>

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 700,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid var(--ink)",
                fontSize: "0.85rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Session</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Rating</th>
              <th style={{ padding: "12px 16px" }}>Note</th>
            </tr>
          </thead>

          <tbody>
            {[...records].reverse().map((record) => (
              <tr
                key={record.id}
                style={{
                  borderBottom: "1px solid #e3ded2",
                  fontSize: "0.9rem",
                }}
              >
                <td style={{ padding: "10px 16px" }}>
                  {record.event.startsAt.toLocaleDateString()}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  {record.event.title}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  {STATUS_LABELS[record.status] ?? record.status}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  {record.rating ?? "—"}
                </td>
                <td style={{ padding: "10px 16px", opacity: 0.75 }}>
                  {record.note ?? "—"}
                </td>
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
    return (
      <p style={{ opacity: 0.7 }}>
        No development assessments have been recorded yet.
      </p>
    );
  }

  const latest = assessments[0];

  function domainAverages(scores: { domain: string; score: number }[]) {
    const domains: Record<string, number[]> = {
      TECHNICAL: [],
      TACTICAL: [],
      PHYSICAL: [],
      MENTAL: [],
    };

    for (const score of scores) {
      domains[score.domain]?.push(score.score);
    }

    return Object.entries(domains).map(([domain, values]) => ({
      label: DOMAIN_LABELS[domain] ?? domain,
      value:
        values.length > 0
          ? Math.round(
              (values.reduce((sum, value) => sum + value, 0) /
                values.length) *
                10,
            ) / 10
          : 0,
    }));
  }

  return (
    <>
      <div style={{ maxWidth: 720 }}>
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            LATEST DOMAIN AVERAGES ·{" "}
            {latest.assessedAt.toLocaleDateString()}
          </h2>

          <ChartLegend
            items={[
              {
                color: "var(--card-orange, #E8A33D)",
                label: "Average score (out of 5)",
              },
            ]}
          />

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
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
            }}
          >
            Summary
          </p>
          <p style={{ marginTop: 4, fontSize: "0.9rem" }}>
            {latest.summary}
          </p>
        </div>
      )}

      {latest.nextGoals && (
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
            }}
          >
            Goals for next period
          </p>
          <p style={{ marginTop: 4, fontSize: "0.9rem" }}>
            {latest.nextGoals}
          </p>
        </div>
      )}

      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--pitch)",
          marginTop: 40,
          marginBottom: 12,
        }}
      >
        ASSESSMENT HISTORY
      </h2>

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 700,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid var(--ink)",
                fontSize: "0.85rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Assessed by</th>
              <th style={{ padding: "12px 16px" }}>Technical</th>
              <th style={{ padding: "12px 16px" }}>Tactical</th>
              <th style={{ padding: "12px 16px" }}>Physical</th>
              <th style={{ padding: "12px 16px" }}>Mental</th>
            </tr>
          </thead>

          <tbody>
            {assessments.map((assessment) => {
              const averages = domainAverages(assessment.scores);

              return (
                <tr
                  key={assessment.id}
                  style={{
                    borderBottom: "1px solid #e3ded2",
                    fontSize: "0.9rem",
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    {assessment.assessedAt.toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {assessment.assessedBy ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {averages[0].value || "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {averages[1].value || "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {averages[2].value || "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {averages[3].value || "—"}
                  </td>
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
    return (
      <p style={{ opacity: 0.7 }}>
        No physical tests have been recorded for this player yet.
      </p>
    );
  }

  const metricSeries = PHYSICAL_TEST_METRICS.map((metric) => {
    const points = tests
      .map((test) => {
        const result = test.results.find(
          (item) => item.metric === metric.label,
        );

        return {
          label: test.testedAt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          value: result?.value,
          score: result?.score ?? null,
        };
      })
      .filter(
        (
          point,
        ): point is {
          label: string;
          value: number;
          score: number | null;
        } => point.value !== undefined,
      );

    return { metric, points };
  }).filter((series) => series.points.length > 0);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
        }}
      >
        {metricSeries.map(({ metric, points }) => {
          const latest = points[points.length - 1];

          return (
            <div key={metric.key} style={cardStyle}>
              <h2
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--pitch)",
                  marginBottom: 4,
                }}
              >
                {metric.label.toUpperCase()}
              </h2>

              {latest &&
                (latest.score != null ? (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--pitch)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Latest score: {latest.score}/100
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--card-red)",
                      marginBottom: 4,
                    }}
                  >
                    Not enough data to calculate a score.
                  </p>
                ))}

              <ChartLegend
                items={[
                  {
                    color: "var(--pitch)",
                    label: `${metric.unit} · ${
                      metric.lowerIsBetter
                        ? "lower is better"
                        : "higher is better"
                    }`,
                  },
                ]}
              />

              <BarChart
                data={points}
                orientation="vertical"
                height={130}
                color="var(--pitch)"
              />
            </div>
          );
        })}
      </div>

      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--pitch)",
          marginTop: 40,
          marginBottom: 12,
        }}
      >
        PHYSICAL TEST HISTORY
      </h2>

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 700,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid var(--ink)",
                fontSize: "0.85rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Tested by</th>
              {PHYSICAL_TEST_METRICS.map((metric) => (
                <th key={metric.key} style={{ padding: "12px 8px" }}>
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[...tests].reverse().map((test) => (
              <tr
                key={test.id}
                style={{
                  borderBottom: "1px solid #e3ded2",
                  fontSize: "0.85rem",
                }}
              >
                <td style={{ padding: "10px 16px" }}>
                  {test.testedAt.toLocaleDateString()}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  {test.testedBy ?? "—"}
                </td>
                {PHYSICAL_TEST_METRICS.map((metric) => {
                  const result = test.results.find(
                    (item) => item.metric === metric.label,
                  );

                  return (
                    <td key={metric.key} style={{ padding: "10px 8px" }}>
                      {result
                        ? `${result.value}${
                            result.unit === "level"
                              ? ""
                              : ` ${result.unit}`
                          }`
                        : "—"}
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

async function renderInjuries(playerId: string) {
  const injuries = await prisma.injuryRecord.findMany({
    where: { playerId },
    orderBy: { dateOccurred: "desc" },
  });

  if (injuries.length === 0) {
    return (
      <p style={{ opacity: 0.7 }}>
        No injuries have been recorded for this player.
      </p>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--pitch)",
          }}
        >
          INJURY HISTORY
        </h2>

        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 4 }}>
          {injuries.length} recorded{" "}
          {injuries.length === 1 ? "injury" : "injuries"}
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 900,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid var(--ink)",
                fontSize: "0.8rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Injury</th>
              <th style={{ padding: "12px 16px" }}>Description</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Expected Return</th>
              <th style={{ padding: "12px 16px" }}>Actual Return</th>
              <th style={{ padding: "12px 16px" }}>Recorded By</th>
            </tr>
          </thead>

          <tbody>
            {injuries.map((injury) => {
              const isActive = injury.status === "ACTIVE";

              return (
                <tr
                  key={injury.id}
                  style={{
                    borderBottom: "1px solid #e3ded2",
                    fontSize: "0.85rem",
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    {injury.dateOccurred.toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontWeight: 600,
                    }}
                  >
                    {injury.injuryType}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      opacity: 0.75,
                      maxWidth: 280,
                    }}
                  >
                    {injury.description ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: isActive ? "#fdecec" : "#edf7ed",
                        color: isActive ? "var(--card-red)" : "var(--pitch)",
                      }}
                    >
                      {isActive ? "Active" : "Recovered"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {injury.expectedReturnDate
                      ? injury.expectedReturnDate.toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {injury.actualReturnDate
                      ? injury.actualReturnDate.toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {injury.recordedBy ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function renderMatches(playerId: string) {
  const performances = await prisma.matchPerformance.findMany({
    where: { playerId },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  if (performances.length === 0) {
    return (
      <p style={{ opacity: 0.7 }}>
        No match statistics have been recorded for this player yet.
      </p>
    );
  }

  const matchesPlayed = performances.filter(
    (performance) => performance.minutesPlayed > 0,
  ).length;

  const totals = performances.reduce(
    (accumulator, performance) => ({
      goals: accumulator.goals + performance.goals,
      assists: accumulator.assists + performance.assists,
      minutesPlayed:
        accumulator.minutesPlayed + performance.minutesPlayed,
      yellowCards: accumulator.yellowCards + performance.yellowCards,
      redCards: accumulator.redCards + performance.redCards,
    }),
    {
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      yellowCards: 0,
      redCards: 0,
    },
  );

  const labels = performances.map((performance) =>
    performance.event.startsAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  );

  const goalContributionSeries = [
    {
      name: "Goals",
      color: "var(--floodlight)",
      values: performances.map((performance) => performance.goals),
    },
    {
      name: "Assists",
      color: "var(--pitch)",
      values: performances.map((performance) => performance.assists),
    },
  ];

  const passingAccuracyData = performances.map((performance, index) => ({
    label: labels[index],
    value:
      performance.passesAttempted > 0
        ? Math.round(
            (performance.passesCompleted / performance.passesAttempted) *
              100,
          )
        : 0,
  }));

  const defensiveActionsData = performances.map((performance, index) => ({
    label: labels[index],
    value:
      performance.tackles +
      performance.interceptions +
      performance.recoveries,
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
          <div
            key={String(label)}
            style={{
              background: "white",
              borderTop: "3px solid var(--floodlight)",
              padding: 16,
            }}
          >
            <div className="display" style={{ fontSize: "1.6rem" }}>
              {value}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-grid-3" style={{ marginTop: 32 }}>
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            GOAL CONTRIBUTIONS
          </h2>
          <GroupedBarChart
            labels={labels}
            series={goalContributionSeries}
            height={140}
          />
        </div>

        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            PASSING ACCURACY
          </h2>
          <ChartLegend
            items={[
              {
                color: "var(--floodlight, #E8A33D)",
                label: "Passes completed (%)",
              },
            ]}
          />
          <BarChart
            data={passingAccuracyData}
            orientation="vertical"
            height={140}
            color="var(--floodlight, #E8A33D)"
            max={100}
            unit="%"
          />
        </div>

        <div style={cardStyle}>
          <h2
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
              marginBottom: 4,
            }}
          >
            DEFENSIVE ACTIONS
          </h2>
          <ChartLegend
            items={[
              {
                color: "var(--card-red)",
                label: "Tackles + interceptions + recoveries",
              },
            ]}
          />
          <BarChart
            data={defensiveActionsData}
            orientation="vertical"
            height={140}
            color="var(--card-red)"
          />
        </div>
      </div>

      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--pitch)",
          marginTop: 40,
          marginBottom: 12,
        }}
      >
        MATCH HISTORY
      </h2>

      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 900,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "2px solid var(--ink)",
                fontSize: "0.8rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Match</th>
              {MATCH_STAT_GROUPS.flatMap((group) => group.fields).map(
                (field) => (
                  <th key={field.key} style={{ padding: "12px 8px" }}>
                    {field.label}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {[...performances].reverse().map((performance) => (
              <tr
                key={performance.id}
                style={{
                  borderBottom: "1px solid #e3ded2",
                  fontSize: "0.85rem",
                }}
              >
                <td style={{ padding: "10px 16px" }}>
                  {performance.event.startsAt.toLocaleDateString()}
                  {performance.event.opponent
                    ? ` vs ${performance.event.opponent}`
                    : ""}
                </td>

                {MATCH_STAT_GROUPS.flatMap((group) => group.fields).map(
                  (field) => (
                    <td
                      key={field.key}
                      style={{ padding: "10px 8px" }}
                    >
                      {
                        (
                          performance as unknown as Record<
                            string,
                            number
                          >
                        )[field.key]
                      }
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}