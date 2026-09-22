"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { MATCH_STAT_KEYS } from "@/lib/matchStats";

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