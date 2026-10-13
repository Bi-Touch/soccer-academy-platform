import { prisma } from "@/lib/prisma";
import { createVideo } from "../actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { NewVideoForm } from "@/components/NewVideoForm";

export default async function NewVideoPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;
  const isAdmin = accessibleTeamIds === null;

  const [teams, players] = await Promise.all([
    prisma.team.findMany({
      where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
    }),
    prisma.player.findMany({
      where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
      include: { user: true, team: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="form-page">
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD VIDEO</h1>

      <NewVideoForm
        action={createVideo}
        isAdmin={isAdmin}
        teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        players={players.map((p) => ({
          id: p.id,
          name: playerName(p),
          teamId: p.teamId,
          teamName: p.team?.name ?? null,
        }))}
      />
    </div>
  );
}