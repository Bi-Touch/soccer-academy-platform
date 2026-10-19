import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteTeam } from "./actions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const rowStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  alignItems: "center",
  gap: 16,
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default async function AdminTeamsPage(
  props: {
    searchParams: Promise<{ deleteBlocked?: string; events?: string; players?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const teams = await prisma.team.findMany({ include: { players: true } });

  // Set by deleteTeam when a team could not be removed. The name is only displayed, never trusted.
  const blockedName = searchParams.deleteBlocked?.slice(0, 80);
  const blockedEvents = Number(searchParams.events) || 0;
  const blockedPlayers = Number(searchParams.players) || 0;
  const blockedParts = [
    blockedEvents > 0 ? plural(blockedEvents, "scheduled event") : null,
    blockedPlayers > 0 ? plural(blockedPlayers, "player") : null,
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TEAMS</h1>
        <Link href="/admin/teams/new" className="button">+ Add Team</Link>
      </div>

      {blockedName && (
        <div
          role="alert"
          style={{ background: "#fdecec", border: "1px solid var(--card-red)", borderRadius: 8, padding: 16, marginTop: 16, color: "var(--card-red)", fontSize: "0.9rem", lineHeight: 1.5 }}
        >
          <strong>{blockedName} can&apos;t be deleted.</strong>{" "}
          {blockedParts.length > 0 ? `It still has ${blockedParts.join(" and ")}. ` : ""}
          Deleting a team permanently removes its scheduled events along with their attendance and match records,
          and leaves its players without a team. Delete the events and move or remove the players first.
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {teams.map((team) => (
          <div key={team.id} style={rowStyle}>
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
