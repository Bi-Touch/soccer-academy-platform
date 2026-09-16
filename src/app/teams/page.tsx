import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { prisma } from "@/lib/prisma";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: { players: true },
  });

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px" }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          OUR TEAMS
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {teams.length === 0 && <p style={{ opacity: 0.7 }}>No teams added yet.</p>}
          {teams.map((team) => (
            <div key={team.id} style={{ borderTop: "3px solid var(--floodlight)", padding: "16px 0", display: "flex", alignItems: "center", gap: 16 }}>
              <PlayerAvatar src={team.crestUrl} alt={team.name} size={56} />
              <div>
                <div className="display" style={{ fontSize: "1.6rem" }}>{team.name}</div>
                <div style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: 4 }}>
                  {team.ageGroup} · {team.players.length} players
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}