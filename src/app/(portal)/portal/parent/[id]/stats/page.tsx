import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";

export default async function ParentChildStatsPage({ params }: { params: { id: string } }) {
  const { player, child } = await requireOwnedChild(params.id);

  const stats = await prisma.playerStat.findMany({
    where: { playerId: player.id },
    orderBy: { season: "desc" },
  });
  const latest = stats[0];

  const tiles: [string, number][] = [
    ["Matches", latest?.matchesPlayed ?? 0],
    ["Goals", latest?.goals ?? 0],
    ["Assists", latest?.assists ?? 0],
    ["Minutes", latest?.minutesPlayed ?? 0],
  ];

  return (
    <ChildPageShell child={child} active="stats">
      <p style={{ fontSize: "0.85rem", opacity: 0.65, marginBottom: 12 }}>
        {latest ? `Latest season: ${latest.season}` : "No season recorded yet"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
        {tiles.map(([label, value]) => (
          <div key={label} style={{ background: "white", border: "1px solid #e3ded2", borderTop: "3px solid var(--floodlight)", borderRadius: 8, padding: 16 }}>
            <div className="display" style={{ fontSize: "1.8rem", color: "var(--pitch)" }}>{value}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.65 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", margin: "32px 0 12px" }}>SEASON HISTORY</h2>
      {stats.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No stats recorded for any season yet.</p>
      ) : (
        <div style={{ overflowX: "auto", background: "white", border: "1px solid #e3ded2", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.8rem" }}>
                {["Season", "Matches", "Goals", "Assists", "Minutes"].map((c) => (
                  <th key={c} style={{ padding: "10px 14px" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0ede5", fontSize: "0.9rem" }}>
                  <td style={{ padding: "10px 14px" }}>{s.season}</td>
                  <td style={{ padding: "10px 14px" }}>{s.matchesPlayed}</td>
                  <td style={{ padding: "10px 14px" }}>{s.goals}</td>
                  <td style={{ padding: "10px 14px" }}>{s.assists}</td>
                  <td style={{ padding: "10px 14px" }}>{s.minutesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChildPageShell>
  );
}