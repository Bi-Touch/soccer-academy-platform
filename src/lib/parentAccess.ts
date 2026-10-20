import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";

/** Loads a child only if the signed-in parent actually owns them; otherwise 404. */
export async function requireOwnedChild(playerId: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "PARENT") notFound();

  const guardian = await prisma.parentGuardian.findUnique({ where: { userId: user.id } });
  if (!guardian) notFound();

  const player = await prisma.player.findUnique({ where: { id: playerId }, include: { team: true } });
  if (!player || player.parentGuardianId !== guardian.id) notFound();

  return {
    // user and guardian are returned so actions can record who made a change.
    user,
    guardian,
    player,
    child: {
      id: player.id,
      name: playerName(player),
      photoUrl: player.photoUrl ?? null,
      teamName: player.team?.name ?? null,
      position: player.position ?? null,
    },
  };
}
