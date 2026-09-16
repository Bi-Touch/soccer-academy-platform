import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function TrainingListPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const sessions = await prisma.scheduleEvent.findMany({
    where: {
      type: { in: ["TRAINING", "DRILL"] },
      ...(accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : {}),
    },
    include: {
      team: { include: { _count: { select: { players: true } } } },
      _count: { select: { attendance: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TRAINING LOG</h1>
      <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
        Record attendance for each training session. Sessions come from the schedule.
      </p>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
            <th style={{ padding: "8px 0" }}>Session</th>
            <th>Team</th>
            <th>Date</th>
            <th>Logged</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const logged = s._count.attendance;
            const squad = s.team._count.players;
            return (
              <tr key={s.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                <td style={{ padding: "10px 0" }}>{s.title}</td>
                <td>{s.team.name}</td>
                <td>{s.startsAt.toLocaleDateString()}</td>
                <td>
                  {logged === 0 ? (
                    <span style={{ color: "var(--card-red)", fontSize: "0.85rem" }}>Not logged</span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>{logged}/{squad}</span>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/admin/training/${s.id}`} style={{ fontSize: "0.9rem" }}>
                    {logged === 0 ? "Log attendance" : "Edit"}
                  </Link>
                </td>
              </tr>
            );
          })}
          {sessions.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "24px 0", opacity: 0.7 }}>
                No training sessions found. Add one under Schedule first (type: Training or Drill).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}