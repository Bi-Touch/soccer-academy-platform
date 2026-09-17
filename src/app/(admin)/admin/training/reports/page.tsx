import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import Link from "next/link";

export default async function TeamTrainingReportPage({ searchParams }: { searchParams: { teamId?: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
    include: { _count: { select: { players: true } } },
  });

  const activeTeamId = searchParams.teamId ?? teams[0]?.id;
  const activeTeam = teams.find((t) => t.id === activeTeamId);

  let sessions: Awaited<ReturnType<typeof loadSessions>> = [];
  if (activeTeam) {
    sessions = await loadSessions(activeTeam.id);
  }

  const squadSize = activeTeam?._count.players ?? 0;

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
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TEAM TRAINING REPORT</h1>

      {teams.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/admin/training/reports?teamId=${t.id}`}
              className={t.id === activeTeamId ? "button" : "button secondary"}
              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      {!activeTeam ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No team available.</p>
      ) : sessions.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No logged training sessions for {activeTeam.name} yet.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 32 }}>
            <div>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                ATTENDANCE RATE PER SESSION (%)
              </h2>
              <BarChart data={attendanceChartData} orientation="vertical" height={160} />
            </div>
            <div>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                AVERAGE RATING PER SESSION
              </h2>
              {ratingChartData.length > 0 ? (
                <BarChart data={ratingChartData} orientation="vertical" height={160} color="var(--card-red)" />
              ) : (
                <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No ratings recorded yet.</p>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
            SESSION BY SESSION
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                <th style={{ padding: "8px 0" }}>Date</th>
                <th>Session</th>
                <th>Attended</th>
                <th>Avg. rating</th>
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                  <td style={{ padding: "8px 0" }}>{s.startsAt.toLocaleDateString()}</td>
                  <td>{s.title}</td>
                  <td>{s.attendedCount}/{squadSize}</td>
                  <td>{s.avgRating !== null ? s.avgRating.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

async function loadSessions(teamId: string) {
  const events = await prisma.scheduleEvent.findMany({
    where: { teamId, type: { in: ["TRAINING", "DRILL"] } },
    include: { attendance: true },
    orderBy: { startsAt: "asc" },
    take: 12,
  });

  return events
    .filter((e) => e.attendance.length > 0)
    .map((e) => {
      const attendedCount = e.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const rated = e.attendance.filter((a) => a.rating !== null);
      const avgRating = rated.length > 0
        ? rated.reduce((sum, a) => sum + (a.rating ?? 0), 0) / rated.length
        : null;
      return {
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        attendedCount,
        avgRating,
      };
    });
}