import { prisma } from "@/lib/prisma";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { BarChart } from "@/components/BarChart";
import { CURRENT_SEASON } from "@/lib/season";

export default async function LeaderboardPage() {
  const stats = await prisma.playerStat.findMany({
    where: { season: CURRENT_SEASON },
    include: { player: { include: { user: true, team: true } } },
  });

  const topScorers = [...stats].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const mostAppearances = [...stats].sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0, 10);
  const chartData = topScorers.slice(0, 5).map((s) => ({ label: s.player.user.name, value: s.goals }));

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>LEADERBOARD</h1>
      <p style={{ opacity: 0.7, marginTop: 4 }}>{CURRENT_SEASON} season</p>

      {chartData.length > 0 && (
        <div style={{ background: "white", padding: 24, marginTop: 24, maxWidth: 480 }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>TOP 5 SCORERS</h2>
          <BarChart data={chartData} orientation="horizontal" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 32 }}>
        <div>
          <h2 className="display" style={{ fontSize: "1.4rem", color: "var(--pitch)", marginBottom: 16 }}>TOP SCORERS</h2>
          {topScorers.length === 0 && <p style={{ opacity: 0.7 }}>No stats recorded yet.</p>}
          {topScorers.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #e3ded2" }}>
              <div className="display" style={{ width: 24, fontSize: "1.1rem", opacity: 0.5 }}>{i + 1}</div>
              <PlayerAvatar src={s.player.photoUrl} alt={s.player.user.name} size={32} rounded />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.player.user.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{s.player.team?.name ?? "Unassigned"}</div>
              </div>
              <div className="display" style={{ fontSize: "1.2rem", color: "var(--pitch)" }}>{s.goals}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="display" style={{ fontSize: "1.4rem", color: "var(--pitch)", marginBottom: 16 }}>MOST APPEARANCES</h2>
          {mostAppearances.length === 0 && <p style={{ opacity: 0.7 }}>No stats recorded yet.</p>}
          {mostAppearances.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #e3ded2" }}>
              <div className="display" style={{ width: 24, fontSize: "1.1rem", opacity: 0.5 }}>{i + 1}</div>
              <PlayerAvatar src={s.player.photoUrl} alt={s.player.user.name} size={32} rounded />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.player.user.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{s.player.team?.name ?? "Unassigned"}</div>
              </div>
              <div className="display" style={{ fontSize: "1.2rem", color: "var(--pitch)" }}>{s.matchesPlayed}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}