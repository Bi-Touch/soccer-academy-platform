"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyTeamOfNewEvent } from "@/lib/notifications";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";

export async function createEvent(formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const teamId = String(formData.get("teamId") || "").trim();
  const type = String(formData.get("type") || "TRAINING") as "TRAINING" | "MATCH" | "DRILL" | "OTHER";
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") || "").trim();
  const opponent = String(formData.get("opponent") || "").trim() || null;
  const homeScoreRaw = String(formData.get("homeScore") || "").trim();
  const awayScoreRaw = String(formData.get("awayScore") || "").trim();

  if (!teamId || !title || !startsAtRaw) {
    throw new Error("Team, title, and date/time are required.");
  }

  assertTeamAccess(accessibleTeamIds, teamId);

    const event = await prisma.scheduleEvent.create({
    data: {
      teamId,
      type,
      title,
      description,
      location,
      startsAt: new Date(startsAtRaw),
      opponent,
      homeScore: homeScoreRaw ? parseInt(homeScoreRaw, 10) : null,
      awayScore: awayScoreRaw ? parseInt(awayScoreRaw, 10) : null,
    },
    include: { team: { select: { name: true } } },
  });

  await notifyTeamOfNewEvent(teamId, event.team.name, title, event.startsAt).catch((e) =>
    console.error("Notification failed:", e)
  );

  revalidatePath("/admin/schedule");
  revalidatePath("/portal/schedule");
  revalidatePath("/fixtures");
  redirect("/admin/schedule");
}

export async function updateEvent(eventId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const existingEvent = await prisma.scheduleEvent.findUnique({ where: { id: eventId } });
  if (!existingEvent) throw new Error("Event not found.");
  assertTeamAccess(accessibleTeamIds, existingEvent.teamId);

  const type = String(formData.get("type") || "TRAINING") as "TRAINING" | "MATCH" | "DRILL" | "OTHER";
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") || "").trim();
  const opponent = String(formData.get("opponent") || "").trim() || null;
  const homeScoreRaw = String(formData.get("homeScore") || "").trim();
  const awayScoreRaw = String(formData.get("awayScore") || "").trim();

  if (!title || !startsAtRaw) {
    throw new Error("Title and date/time are required.");
  }

  await prisma.scheduleEvent.update({
    where: { id: eventId },
    data: {
      type,
      title,
      description,
      location,
      startsAt: new Date(startsAtRaw),
      opponent,
      homeScore: homeScoreRaw ? parseInt(homeScoreRaw, 10) : null,
      awayScore: awayScoreRaw ? parseInt(awayScoreRaw, 10) : null,
    },
  });

  revalidatePath("/admin/schedule");
  revalidatePath("/portal/schedule");
  revalidatePath("/fixtures");
  redirect("/admin/schedule");
}

export async function deleteEvent(eventId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const event = await prisma.scheduleEvent.findUnique({ where: { id: eventId } });
  if (!event) return;
  assertTeamAccess(accessibleTeamIds, event.teamId);

  await prisma.scheduleEvent.delete({ where: { id: eventId } });
  revalidatePath("/admin/schedule");
  revalidatePath("/portal/schedule");
  revalidatePath("/fixtures");
}