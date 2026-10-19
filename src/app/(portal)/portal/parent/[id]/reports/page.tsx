import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { BarChart } from "@/components/BarChart";
import { ChartLegend } from "@/components/ChartLegend";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { formatDate } from "@/lib/dates";

const LABELS = DOMAIN_LABELS as Record<string, string>;

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT_EXCUSED: "Absent (excused)",
  ABSENT_UNEXCUSED: "Absent (unexcused)",
  INJURED: "Injured",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #e3ded2", borderTop: "3px solid var(--floodlight)", borderRadius: 8, padding: 14 }}>
      <div className="display" style={{ fontSize: "1.5rem", color: "var(--pitch)" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", opacity: 0.65 }}>{label}</div>
    </div>
  );
}

function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
      {children}
    </div>
  );
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #e3ded2", borderRadius: 8, background: "white" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.8rem" }}>
            {columns.map((c) => (
              <th key={c} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f0ede5", fontSize: "0.85rem" }}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: "9px 14px" }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function domainAverages(scores: { domain: unknown; score: number }[]) {
  return DOMAINS.map((d) => {
    const vals = scores.filter((s) => String(s.domain) === String(d)).map((s) => s.score);
    return {
      label: LABELS[String(d)] ?? String(d),
      value: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null,
    };
  });
}

export default async function ParentChildReportsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { player, child } = await requireOwnedChild(params.id);

  const [attendance, assessments, tests, performances] = await Promise.all([
    prisma.trainingAttendance.findMany({
      where: { playerId: player.id },
      include: { event: true },
      orderBy: { event: { startsAt: "desc" } },
    }),
    prisma.developmentAssessment.findMany({
      where: { playerId: player.id },
      include: { scores: true },
      orderBy: { assessedAt: "desc" },
    }),
    prisma.physicalTest.findMany({
      where: { playerId: player.id },
      include: { results: true },
      orderBy: { testedAt: "desc" },
    }),
    prisma.matchPerformance.findMany({
      where: { playerId: player.id },
      include: { event: true },
      orderBy: { event: { startsAt: "desc" } },
    }),
  ]);

  // Training
  const attended = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const ratings = attendance.map((a) => a.rating).filter((r): r is number => r != null);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";

  // Assessments
  const latestAssessment = assessments[0];

  // Physical tests: latest result per metric
  const physicalRows: string[][] = [];
  for (const m of PHYSICAL_TEST_METRICS) {
    for (const t of tests) {
      const r = t.results.find((x) => x.metric === m.label);
      if (r) {
        physicalRows.push([
          m.label,
          `${r.value} ${r.unit}`,
          r.score != null ? `${Math.round(r.score)}/100` : "—",
          formatDate(t.testedAt),
        ]);
        break;
      }
    }
  }

  // Matches
  const goals = performances.reduce((s, p) => s + p.goals, 0);
  const assists = performances.reduce((s, p) => s + p.assists, 0);
  const minutes = performances.reduce((s, p) => s + p.minutesPlayed, 0);
  const yellow = performances.reduce((s, p) => s + p.yellowCards, 0);
  const red = performances.reduce((s, p) => s + p.redCards, 0);
  const matchesPlayed = performances.filter((p) => p.minutesPlayed > 0).length;

  return (
    <ChildPageShell child={child} active="reports">
      <details className="guide-section" open>
        <summary className="guide-section-summary">Training</summary>
        <div className="guide-section-body">
          {attendance.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No training sessions logged yet.</p>
          ) : (
            <>
              <StatRow>
                <Stat label="Sessions logged" value={String(attendance.length)} />
                <Stat label="Attendance" value={`${Math.round((attended / attendance.length) * 100)}%`} />
                <Stat label="Avg. rating" value={avgRating === "—" ? "—" : `${avgRating}/5`} />
              </StatRow>
              <SimpleTable
                columns={["Date", "Session", "Status", "Rating"]}
                rows={attendance.slice(0, 15).map((a) => [
                  formatDate(a.event.startsAt),
                  a.event.title,
                  STATUS_LABELS[a.status] ?? a.status,
                  a.rating != null ? String(a.rating) : "—",
                ])}
              />
              {attendance.length > 15 && (
                <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>Showing the 15 most recent sessions.</p>
              )}
            </>
          )}
        </div>
      </details>

      <details className="guide-section">
        <summary className="guide-section-summary">Assessments</summary>
        <div className="guide-section-body">
          {!latestAssessment ? (
            <p style={{ opacity: 0.7 }}>No assessments recorded yet.</p>
          ) : (
            <>
              <p style={{ fontSize: "0.85rem", opacity: 0.65, marginBottom: 8 }}>
                Latest assessment &middot; {formatDate(latestAssessment.assessedAt)}
              </p>
              <ChartLegend items={[{ color: "var(--card-orange, #E8A33D)", label: "Average score (out of 5)" }]} />
              <BarChart
                data={domainAverages(latestAssessment.scores).map((d) => ({ label: d.label, value: d.value ?? 0 }))}
                orientation="vertical"
                height={160}
                color="var(--card-orange, #E8A33D)"
                max={5}
              />

              {latestAssessment.summary && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--pitch)" }}>Summary</div>
                  <p style={{ margin: "4px 0 0", lineHeight: 1.6, fontSize: "0.9rem" }}>{latestAssessment.summary}</p>
                </div>
              )}
              {latestAssessment.nextGoals && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--pitch)" }}>Goals for the next period</div>
                  <p style={{ margin: "4px 0 0", lineHeight: 1.6, fontSize: "0.9rem" }}>{latestAssessment.nextGoals}</p>
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <SimpleTable
                  columns={["Date", "Assessed by", ...DOMAINS.map((d) => LABELS[String(d)] ?? String(d))]}
                  rows={assessments.map((a) => [
                    formatDate(a.assessedAt),
                    a.assessedBy ?? "—",
                    ...domainAverages(a.scores).map((d) => (d.value != null ? String(d.value) : "—")),
                  ])}
                />
              </div>
            </>
          )}
        </div>
      </details>

      <details className="guide-section">
        <summary className="guide-section-summary">Physical tests</summary>
        <div className="guide-section-body">
          {physicalRows.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No physical tests recorded yet.</p>
          ) : (
            <>
              <SimpleTable columns={["Test", "Latest result", "Score", "Tested"]} rows={physicalRows} />
              <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>
                Scores out of 100 compare your child with the Academy benchmark for their age group.
              </p>
            </>
          )}
        </div>
      </details>

      <details className="guide-section">
        <summary className="guide-section-summary">Match performance</summary>
        <div className="guide-section-body">
          {performances.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No match stats recorded yet.</p>
          ) : (
            <>
              <StatRow>
                <Stat label="Matches" value={String(matchesPlayed)} />
                <Stat label="Goals" value={String(goals)} />
                <Stat label="Assists" value={String(assists)} />
                <Stat label="Minutes" value={String(minutes)} />
                <Stat label="Cards" value={`${yellow}Y / ${red}R`} />
              </StatRow>
              <SimpleTable
                columns={["Date", "Match", "Minutes", "Goals", "Assists"]}
                rows={performances.slice(0, 15).map((p) => [
                  formatDate(p.event.startsAt),
                  p.event.title,
                  String(p.minutesPlayed),
                  String(p.goals),
                  String(p.assists),
                ])}
              />
              {performances.length > 15 && (
                <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>Showing the 15 most recent matches.</p>
              )}
            </>
          )}
        </div>
      </details>
    </ChildPageShell>
  );
}