import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT_EXCUSED: "Absent (excused)",
  ABSENT_UNEXCUSED: "Absent (unexcused)",
  INJURED: "Injured",
};

export default async function PlayerTrainingReportPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const records = await prisma.trainingAttendance.findMany({
    where: { playerId: params.id },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  const total = records.length;
  const attendedCount = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const attendanceRate = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

  const ratedRecords = records.filter((r) => r.rating !== null);
  const avgRating = ratedRecords.length > 0
    ? (ratedRecords.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedRecords.length).toFixed(1)
    : "—";

  const statusCounts: Record<string, number> = {};
  for (const r of records) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  }

  const ratingChartData = ratedRecords.slice(-10).map((r) => ({
    label: r.event.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: r.rating ?? 0,
  }));

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    label: STATUS_LABELS[status] ?? status,
    value: count,
  }));

  return (
    <div>
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {player.user.name.toUpperCase()} — TRAINING REPORT
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 24, maxWidth: 560 }}>
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 20 }}>
          <div className="display" style={{ fontSize: "2rem" }}>{total}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Sessions logged</div>
        </div>
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 20 }}>
          <div className="display" style={{ fontSize: "2rem" }}>{attendanceRate}%</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Attendance rate</div>
        </div>
        <div style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 20 }}>
          <div className="display" style={{ fontSize: "2rem" }}>{avgRating}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Avg. session rating</div>
        </div>
      </div>

      {total === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No training sessions logged for this player yet.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 40 }}>
            <div>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                RATING — LAST {ratingChartData.length} RATED SESSIONS
              </h2>
              {ratingChartData.length > 0 ? (
                <BarChart data={ratingChartData} orientation="vertical" height={160} />
              ) : (
                <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No ratings recorded yet.</p>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                ATTENDANCE BREAKDOWN
              </h2>
              <BarChart data={statusChartData} orientation="horizontal" />
            </div>
          </div>

          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
            SESSION HISTORY
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                <th style={{ padding: "8px 0" }}>Date</th>
                <th>Session</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                  <td style={{ padding: "8px 0" }}>{r.event.startsAt.toLocaleDateString()}</td>
                  <td>{r.event.title}</td>
                  <td>{STATUS_LABELS[r.status] ?? r.status}</td>
                  <td>{r.rating ?? "—"}</td>
                  <td style={{ opacity: 0.75 }}>{r.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}