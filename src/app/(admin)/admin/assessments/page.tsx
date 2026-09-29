import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { playerName } from "@/lib/playerDisplay";

const rowStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 16,
};

export default async function AdminAssessmentsPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const players = await prisma.player.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: {
      team: true,
      assessments: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ASSESSMENTS</h1>
        <Link href="/admin/assessments/import" className="button outline">Import CSV</Link>
      </div>  
      <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
        Log a development assessment for a player. History and charts live under each player's Reports.
      </p>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {players.map((p) => {
          const latest = p.assessments[0];
          return (
            <div key={p.id} style={rowStyle}>
              <PlayerAvatar src={p.photoUrl} alt={playerName(p)} size={44} rounded />
              <div style={{ flex: "1 1 200px" }}>
                <strong>{playerName(p)}</strong>
                <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>
                  {p.team?.name ?? "No team"} &middot;{" "}
                  {latest ? `Last assessed ${latest.assessedAt.toLocaleDateString()}` : "Never assessed"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Link href={`/admin/players/${p.id}/assessments/new`} className="button" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                  + New Assessment
                </Link>
                <Link href={`/admin/players/${p.id}/reports`} style={{ fontSize: "0.85rem" }}>
                  View reports
                </Link>
              </div>
            </div>
          );
        })}
        {players.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            {accessibleTeamIds && accessibleTeamIds.length === 0
              ? "You aren't assigned to any teams yet."
              : "No players yet."}
          </p>
        )}
      </div>
    </div>
  );
}