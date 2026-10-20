import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerDirectory } from "@/components/PlayerDirectory";
import { prisma } from "@/lib/prisma";
import { playerName } from "@/lib/playerDisplay";
import { sortPlayersByAgeGroup } from "@/lib/teamOrder";
import { getConsentedPlayerIds } from "@/lib/consentLedger";
import { publicPlayerName } from "@/lib/publicMedia";

// Must be rendered on every request. A cached copy would keep showing a child after
// their parent withdraws consent.
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [allPlayers, listedIds, photoIds] = await Promise.all([
    prisma.player.findMany({
      include: { user: true, team: true },
    }),
    // A child is listed publicly only while their parent allows public use...
    getConsentedPlayerIds(["PUBLIC_MEDIA"]),
    // ...and their photo is shown only if photography is also allowed.
    getConsentedPlayerIds(["PUBLIC_MEDIA", "PHOTOGRAPHY"]),
  ]);

  // Players with no consent record at all are hidden (no record means no consent).
  const players = allPlayers.filter((p) => listedIds.has(p.id));

  // Youngest age group first (U13, U15, U17), unassigned players last, alphabetical within a group.
  const sortedPlayers = sortPlayersByAgeGroup(players, playerName);

  const rows = sortedPlayers.map((p) => ({
    id: p.id,
    name: publicPlayerName(playerName(p)),
    position: p.position,
    shirtNumber: p.shirtNumber,
    photoUrl: photoIds.has(p.id) ? p.photoUrl : null,
    teamName: p.team?.name ?? null,
  }));

  // The team filter follows the same age order because it is built from the sorted list.
  const teamNames = [...new Set(rows.map((r) => r.teamName).filter(Boolean))] as string[];
  const positions = ([...new Set(rows.map((r) => r.position).filter(Boolean))] as string[]).sort((a, b) =>
    a.localeCompare(b)
  );

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
