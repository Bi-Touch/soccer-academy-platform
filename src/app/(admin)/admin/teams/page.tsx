import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteTeam } from "./actions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({ include: { players: true } });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TEAMS</h1>
        <Link href="/admin/teams/new" className="button">+ Add Team</Link>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {teams.map((team) => (
          <div key={team.id} style={{ background: "white", padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <PlayerAvatar src={team.crestUrl} alt={team.name} size={48} />
            <div style={{ flex: 1 }}>
              <strong>{team.name}</strong>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{team.ageGroup} · {team.players.length} players</div>
            </div>
            <Link href={`/admin/teams/${team.id}/edit`} style={{ marginRight: 16, fontSize: "0.9rem" }}>Edit</Link>
            <form action={deleteTeam.bind(null, team.id)}>
              <button
                type="submit"
                style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
              >
                Remove
              </button>
            </form>
          </div>
        ))}
        {teams.length === 0 && <p style={{ opacity: 0.7 }}>No teams yet — click "Add Team" to create the first one.</p>}
      </div>
    </div>
  );
}