import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerDirectory } from "@/components/PlayerDirectory";
import { prisma } from "@/lib/prisma";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    include: { user: true, team: true },
  });

  const rows = players.map((p) => ({
    id: p.id,
    name: p.user.name,
    position: p.position,
    shirtNumber: p.shirtNumber,
    photoUrl: p.photoUrl,
    teamName: p.team?.name ?? null,
  }));

  const teamNames = [...new Set(rows.map((r) => r.teamName).filter(Boolean))] as string[];
  const positions = [...new Set(rows.map((r) => r.position).filter(Boolean))] as string[];

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px" }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          PLAYERS
        </h1>
        {rows.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No players listed yet.</p>
        ) : (
          <PlayerDirectory players={rows} teamNames={teamNames} positions={positions} />
        )}
      </section>
      <SiteFooter />
    </>
  );
}