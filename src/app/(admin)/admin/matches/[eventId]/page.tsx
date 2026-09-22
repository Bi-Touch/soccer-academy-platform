import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { saveMatchPerformance } from "../actions";
import { MatchStatsForm } from "@/components/MatchStatsForm";
import { MATCH_STAT_KEYS } from "@/lib/matchStats";

export default async function LogMatchStatsPage({ params }: { params: { eventId: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: params.eventId },
    include: {
      team: { include: { players: { include: { user: true }, orderBy: { user: { name: "asc" } } } } },
      performances: true,
    },
  });

  if (!event) return notFound();
  if (accessibleTeamIds && !accessibleTeamIds.includes(event.teamId)) return notFound();

  const saveWithId = saveMatchPerformance.bind(null, event.id);

  const players = event.team.players.map((p) => ({
    id: p.id,
    name: p.user.name,
    photoUrl: p.photoUrl,
    position: p.position,
  }));

  const existing: Record<string, Record<string, number>> = {};
  for (const perf of event.performances) {
    const record: Record<string, number> = {};
    for (const key of MATCH_STAT_KEYS) {
      record[key] = (perf as unknown as Record<string, number>)[key] ?? 0;
    }
    existing[perf.playerId] = record;
  }

  return (
    <div>
      <Link href="/admin/matches" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All matches</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {event.title.toUpperCase()}
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: 4 }}>
        {event.team.name} &middot; {event.startsAt.toLocaleDateString()}
        {event.opponent ? ` vs ${event.opponent}` : ""}
        {event.homeScore !== null && event.awayScore !== null ? ` · ${event.homeScore}-${event.awayScore}` : ""}
      </p>
      <p style={{ opacity: 0.6, fontSize: "0.8rem", marginTop: 8 }}>
        Click a player to expand and enter their stats. Unopened players are saved as all-zero unless you expand and fill them in.
      </p>

      {players.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No players assigned to this team yet.</p>
      ) : (
        <div style={{ marginTop: 24 }}>
          <MatchStatsForm players={players} existing={existing} action={saveWithId} />
        </div>
      )}
    </div>
  );
}