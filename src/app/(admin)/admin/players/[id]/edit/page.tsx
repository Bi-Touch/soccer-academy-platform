import { prisma } from "@/lib/prisma";
import { updatePlayer, upsertPlayerStat, addProgressNote } from "../../actions";
import { notFound } from "next/navigation";
import { POSITIONS } from "@/lib/positions";
import { CURRENT_SEASON } from "@/lib/season";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { EditPlayerTabs } from "@/components/EditPlayerTabs";

export default async function EditPlayerPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const [player, teams, currentStat, careerStats, progressNotes] = await Promise.all([
    prisma.player.findUnique({ where: { id: params.id }, include: { user: true } }),
    prisma.team.findMany({ where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined }),
    prisma.playerStat.findFirst({ where: { playerId: params.id, season: CURRENT_SEASON } }),
    prisma.playerStat.findMany({ where: { playerId: params.id }, orderBy: { season: "desc" } }),
    prisma.progressNote.findMany({ where: { playerId: params.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const canEditProfile = user?.role === "ADMIN";

  const updatePlayerWithId = updatePlayer.bind(null, player.id);
  const upsertStatWithId = upsertPlayerStat.bind(null, player.id, CURRENT_SEASON);
  const addNoteWithId = addProgressNote.bind(null, player.id);
  const dobValue = player.dateOfBirth ? player.dateOfBirth.toISOString().slice(0, 10) : "";

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)", marginBottom: 24 }}>
        EDIT PLAYER
      </h1>

      <EditPlayerTabs
        playerName={player.user.name}
        dateOfBirth={dobValue}
        photoUrl={player.photoUrl ?? ""}
        position={player.position ?? ""}
        shirtNumber={player.shirtNumber}
        teamId={player.teamId ?? ""}
        teams={teams}
        currentSeason={CURRENT_SEASON}
        currentStat={currentStat}
        careerStats={careerStats}
        positions={POSITIONS}
        updatePlayerAction={updatePlayerWithId}
        upsertStatAction={upsertStatWithId}
        playerId={player.id}
        progressNotes={progressNotes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
        addNoteAction={addNoteWithId}
        canEditProfile={canEditProfile}
      />
    </div>
  );
}