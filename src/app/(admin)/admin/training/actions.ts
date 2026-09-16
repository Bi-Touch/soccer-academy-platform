"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";

const VALID_STATUSES = ["PRESENT", "LATE", "ABSENT_EXCUSED", "ABSENT_UNEXCUSED", "INJURED"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function saveAttendance(eventId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: { team: { include: { players: true } } },
  });
  if (!event) throw new Error("Session not found.");
  assertTeamAccess(accessibleTeamIds, event.teamId);

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
  const recordedBy = staffUser?.name ?? null;

  for (const player of event.team.players) {
    const rawStatus = String(formData.get(`status_${player.id}`) || "PRESENT");
    const status = (VALID_STATUSES.includes(rawStatus as Status) ? rawStatus : "PRESENT") as Status;
    const ratingRaw = String(formData.get(`rating_${player.id}`) || "").trim();
    const note = String(formData.get(`note_${player.id}`) || "").trim() || null;

    const data = {
      status,
      rating: ratingRaw ? parseInt(ratingRaw, 10) : null,
      note,
      recordedBy,
    };

    await prisma.trainingAttendance.upsert({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      create: { eventId, playerId: player.id, ...data },
      update: data,
    });
  }

  revalidatePath("/admin/training");
  revalidatePath(`/admin/training/${eventId}`);
  redirect("/admin/training");
}