import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function MatchesListPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const matches = await prisma.scheduleEvent.findMany({
    where: {
      type: "MATCH",
      ...(accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : {}),
    },
    include: {
      team: { include: { _count: { select: { players: true } } } },
      _count: { select: { performances: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>MATCH STATS</h1>
      <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
        Log individual player stats for each match. Matches come from the schedule.
      </p>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
            <th style={{ padding: "8px 0" }}>Match</th>
            <th>Team</th>
            <th>Date</th>
            <th>Result</th>
            <th>Logged</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => {
            const logged = m._count.performances;
            const squad = m.team._count.players;
            return (
              <tr key={m.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                <td style={{ padding: "10px 0" }}>{m.title}</td>
                <td>{m.team.name}</td>
                <td>{m.startsAt.toLocaleDateString()}</td>
                <td>
                  {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : "—"}
                </td>
                <td>
                  {logged === 0 ? (
                    <span style={{ color: "var(--card-red)", fontSize: "0.85rem" }}>Not logged</span>
                  ) : (
                    <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>{logged}/{squad}</span>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/admin/matches/${m.id}`} style={{ fontSize: "0.9rem" }}>
                    {logged === 0 ? "Log stats" : "Edit"}
                  </Link>
                </td>
              </tr>
            );
          })}
          {matches.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "24px 0", opacity: 0.7 }}>
                No matches found. Add one under Schedule first (type: Match).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}