import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deletePlayer } from "./actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

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

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
            <th style={{ padding: "8px 0" }}>Name</th>
            <th>Team</th>
            <th>Position</th>
            <th>Shirt #</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #e3ded2" }}>
              <td style={{ padding: "8px 0" }}>{p.user.name}</td>
              <td>{p.team?.name ?? "—"}</td>
              <td>{p.position ?? "—"}</td>
              <td>{p.shirtNumber ?? "—"}</td>
              <td style={{ textAlign: "right" }}>
                <Link href={`/admin/players/${p.id}/edit`} style={{ marginRight: 16, fontSize: "0.9rem" }}>
                  Edit
                </Link>
                <Link href={`/admin/players/${p.id}/training`} style={{ marginRight: 16, fontSize: "0.9rem" }}>
                  Training
                </Link>
                <form action={deletePlayer.bind(null, p.id)} style={{ display: "inline" }}>
                  <button
                    type="submit"
                    style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
                  >
                    Remove
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "24px 0", opacity: 0.7 }}>
                {accessibleTeamIds && accessibleTeamIds.length === 0
                  ? "You aren't assigned to any teams yet."
                  : 'No players yet — click "Add Player" to create the first one.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}