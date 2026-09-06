import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: { stats: true, team: { include: { schedules: true } } },
  });

  const upcoming = player?.team?.schedules
    .filter((s) => s.startsAt > new Date())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 3);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>
        WELCOME BACK, {session?.user?.name?.toUpperCase()}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 32 }}>
        {[
          ["Goals", player?.stats[0]?.goals ?? 0],
          ["Assists", player?.stats[0]?.assists ?? 0],
          ["Matches", player?.stats[0]?.matchesPlayed ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} style={{ background: "white", borderTop: "3px solid var(--floodlight)", padding: 20 }}>
            <div className="display" style={{ fontSize: "2.2rem" }}>{value}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", marginTop: 48, marginBottom: 16 }}>
        UPCOMING
      </h2>
      {(!upcoming || upcoming.length === 0) && <p style={{ opacity: 0.7 }}>Nothing scheduled yet.</p>}
      {upcoming?.map((event) => (
        <div key={event.id} style={{ borderBottom: "1px solid #e3ded2", padding: "12px 0" }}>
          <strong>{event.title}</strong> — {event.startsAt.toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}
