"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toCsv } from "@/lib/csv";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { MATCH_STAT_GROUPS, MATCH_STAT_KEYS } from "@/lib/matchStats";
import { playerName } from "@/lib/playerDisplay";

export async function saveMatchPerformance(eventId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: { team: { include: { players: true } } },
  });
  if (!event) throw new Error("Match not found.");
  assertTeamAccess(accessibleTeamIds, event.teamId);

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
  const recordedBy = staffUser?.name ?? null;

  for (const player of event.team.players) {
    const data: Record<string, number> = {};
    for (const key of MATCH_STAT_KEYS) {
      const raw = String(formData.get(`${key}_${player.id}`) || "").trim();
      data[key] = raw ? parseInt(raw, 10) : 0;
    }

    await prisma.matchPerformance.upsert({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      create: { eventId, playerId: player.id, recordedBy, ...data },
      update: { recordedBy, ...data },
    });
  }

  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${eventId}`);
  redirect("/admin/matches");
}

export async function exportMatchStats(): Promise<string> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const performances = await prisma.matchPerformance.findMany({
    where: accessibleTeamIds ? { player: { teamId: { in: accessibleTeamIds } } } : undefined,
    include: { player: { include: { user: true, team: true } }, event: true },
    orderBy: { event: { startsAt: "desc" } },
  });
  const headers = ["team", "match", "date", "player", "playerEmail", ...MATCH_STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key))];
  const rows = performances.map((p) => [
    p.player.team?.name ?? "", p.event.title, p.event.startsAt.toISOString().slice(0, 10),
    playerName(p.player), p.player.user?.email ?? "",
    ...MATCH_STAT_GROUPS.flatMap((g) => g.fields.map((f) => (p as unknown as Record<string, number>)[f.key].toString())),
  ]);
  return toCsv(headers, rows);
}

