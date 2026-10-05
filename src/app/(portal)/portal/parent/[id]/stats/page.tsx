import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { playerName } from "@/lib/playerDisplay";

export default async function ParentPlayerStatsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({ where: { userId: session.user.id } });
  if (!guardian) return notFound();

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { stats: { orderBy: { season: "desc" } } },
  });
  if (!player || player.parentGuardianId !== guardian.id) return notFound();

  const latest = player.stats[0];

  return (
    <div>
      <Link href="/portal/parent" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; My Children</Link>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)", marginTop: 12 }}>
        {playerName(player).toUpperCase()} — STATS
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 24, maxWidth: 560 }}>
        {[
          ["Matches", latest?.matchesPlayed ?? 0],
          ["Goals", latest?.goals ?? 0],
          ["Assists", latest?.assists ?? 0],
          ["Minutes", latest?.minutesPlayed ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 20 }}>
            <div className="display" style={{ fontSize: "1.8rem" }}>{value}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: "1.4rem", color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
        SEASON HISTORY
      </h2>
      {player.stats.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No stats recorded for any season yet.</p>
      ) : (
        <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                <th style={{ padding: "12px 16px" }}>Season</th>
                <th style={{ padding: "12px 16px" }}>Matches</th>
                <th style={{ padding: "12px 16px" }}>Goals</th>
                <th style={{ padding: "12px 16px" }}>Assists</th>
                <th style={{ padding: "12px 16px" }}>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {player.stats.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.9rem" }}>
                  <td style={{ padding: "10px 16px" }}>{s.season}</td>
                  <td style={{ padding: "10px 16px" }}>{s.matchesPlayed}</td>
                  <td style={{ padding: "10px 16px" }}>{s.goals}</td>
                  <td style={{ padding: "10px 16px" }}>{s.assists}</td>
                  <td style={{ padding: "10px 16px" }}>{s.minutesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}