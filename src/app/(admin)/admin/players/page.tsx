import { prisma } from "@/lib/prisma";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    include: { user: true, team: true },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>PLAYERS</h1>
      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
            <th style={{ padding: "8px 0" }}>Name</th>
            <th>Team</th>
            <th>Position</th>
            <th>Shirt #</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #e3ded2" }}>
              <td style={{ padding: "8px 0" }}>{p.user.name}</td>
              <td>{p.team?.name ?? "—"}</td>
              <td>{p.position ?? "—"}</td>
              <td>{p.shirtNumber ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 24, opacity: 0.7, fontSize: "0.9rem" }}>
        Add/edit forms go here next — this view proves the data layer end-to-end.
      </p>
    </div>
  );
}
