import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deletePlayer } from "./actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const tagStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--pitch)",
  background: "#f4f1ea",
  padding: "2px 8px",
  borderRadius: 10,
};

const actionLinkStyle = { fontSize: "0.9rem" };

export default async function AdminPlayersPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const players = await prisma.player.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { user: true, team: true },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>PLAYERS</h1>
        {user?.role === "ADMIN" ? (
          <Link href="/admin/players/new" className="button">+ Add Player</Link>
        ) : (
          <Link href="/admin/players/assign" className="button">+ Add Player to Team</Link>
        )}
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              background: "white",
              padding: 16,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
            }}
          >
            <PlayerAvatar src={p.photoUrl} alt={p.user.name} size={48} rounded />

            <div style={{ flex: "1 1 200px" }}>
              <strong>{p.user.name}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                <span style={tagStyle}>{p.team?.name ?? "No team"}</span>
                {p.position && <span style={tagStyle}>{p.position}</span>}
                {p.shirtNumber != null && <span style={tagStyle}>#{p.shirtNumber}</span>}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <Link href={`/admin/players/${p.id}/edit`} style={actionLinkStyle}>Edit</Link>
              <Link href={`/admin/players/${p.id}/training`} style={actionLinkStyle}>Training</Link>
              <Link href={`/admin/players/${p.id}/assessments`} style={actionLinkStyle}>Assessments</Link>
              <Link href={`/admin/players/${p.id}/physical-tests`} style={actionLinkStyle}>Physical</Link>
              <Link href={`/admin/players/${p.id}/match-stats`} style={actionLinkStyle}>Match Stats</Link>
              <form action={deletePlayer.bind(null, p.id)}>
                <button
                  type="submit"
                  style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
                >
                  Remove
                </button>
              </form>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            {accessibleTeamIds && accessibleTeamIds.length === 0
              ? "You aren't assigned to any teams yet."
              : 'No players yet — click "Add Player" to create the first one.'}
          </p>
        )}
      </div>
    </div>
  );
}