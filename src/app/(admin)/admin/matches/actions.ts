"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toCsv } from "@/lib/csv";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { MATCH_STAT_GROUPS, MATCH_STAT_KEYS } from "@/lib/matchStats";
import { playerName } from "@/lib/playerDisplay";
import { logAudit, diffFields } from "@/lib/audit";

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

  // Existing stats, so the log can show what actually changed per player.
  const existingPerformances = await prisma.matchPerformance.findMany({ where: { eventId } });
  const existingByPlayer = new Map(existingPerformances.map((p) => [p.playerId, p]));
  const zeroBaseline: Record<string, unknown> = Object.fromEntries(MATCH_STAT_KEYS.map((k) => [k, 0]));
  const playerChanges: Record<string, unknown> = {};

  for (const player of event.team.players) {
    const data: Record<string, number> = {};
    for (const key of MATCH_STAT_KEYS) {
      const raw = String(formData.get(`${key}_${player.id}`) || "").trim();
      data[key] = raw ? parseInt(raw, 10) : 0;
    }

    // A player with no saved record yet is compared against zeros, so untouched fields are not logged.
    const before = existingByPlayer.get(player.id);
    const diff = diffFields(before ? (before as unknown as Record<string, unknown>) : zeroBaseline, data);
    if (Object.keys(diff).length > 0) {
      playerChanges[player.id] = { player: player.name ?? player.id, changes: diff };
    }

    await prisma.matchPerformance.upsert({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      create: { eventId, playerId: player.id, recordedBy, ...data },
      update: { recordedBy, ...data },
    });
  }

  // Saving with no actual changes is not logged, to keep the log free of noise.
  const changedCount = Object.keys(playerChanges).length;
  if (changedCount > 0) {
    await logAudit({
      action: "match.stats.save",
      entityType: "ScheduleEvent",
      entityId: eventId,
      summary: `Saved match stats for ${event.title} (${changedCount} player${changedCount === 1 ? "" : "s"} changed)`,
      changes: playerChanges,
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

  // The export contains player names and emails, so it is worth a record of who took it.
  await logAudit({
    action: "match.export",
    entityType: "MatchPerformance",
    summary: `Exported ${performances.length} match performance rows to CSV`,
    changes: { rowCount: performances.length, scopedToTeams: accessibleTeamIds ? accessibleTeamIds.length : "all" },
  });

  return toCsv(headers, rows);
}
