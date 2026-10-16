"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyTeamOfNewEvent } from "@/lib/notifications";
import { toCsv } from "@/lib/csv";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

// Full timestamps are logged as ISO strings so diffFields compares values, not Date object references.
function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

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

  await logAudit({
    action: "schedule.create",
    entityType: "ScheduleEvent",
    entityId: event.id,
    summary: `Created ${type.toLowerCase()} "${title}" for ${event.team.name}`,
    changes: diffFields(null, {
      team: event.team.name,
      type,
      title,
      description,
      location,
      startsAt: iso(event.startsAt),
      opponent,
      homeScore: event.homeScore,
      awayScore: event.awayScore,
    }),
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

  const updated = await prisma.scheduleEvent.update({
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

  const changes = diffFields(
    {
      type: existingEvent.type,
      title: existingEvent.title,
      description: existingEvent.description,
      location: existingEvent.location,
      startsAt: iso(existingEvent.startsAt),
      opponent: existingEvent.opponent,
      homeScore: existingEvent.homeScore,
      awayScore: existingEvent.awayScore,
    },
    {
      type: updated.type,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      startsAt: iso(updated.startsAt),
      opponent: updated.opponent,
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
    }
  );

  // Saving with no actual changes is not logged, to keep the log free of noise.
  if (Object.keys(changes).length > 0) {
    await logAudit({
      action: "schedule.update",
      entityType: "ScheduleEvent",
      entityId: eventId,
      summary: `Updated ${updated.type.toLowerCase()} "${updated.title}"`,
      changes,
    });
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/portal/schedule");
  revalidatePath("/fixtures");
  redirect("/admin/schedule");
}

export async function deleteEvent(eventId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: { team: { select: { name: true } } },
  });
  if (!event) return;
  assertTeamAccess(accessibleTeamIds, event.teamId);

  await prisma.scheduleEvent.delete({ where: { id: eventId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "schedule.delete",
    entityType: "ScheduleEvent",
    entityId: eventId,
    summary: `Deleted ${event.type.toLowerCase()} "${event.title}" for ${event.team.name}`,
    changes: diffFields(
      { title: event.title, type: event.type, startsAt: iso(event.startsAt), opponent: event.opponent },
      { title: null, type: null, startsAt: null, opponent: null }
    ),
  });

  revalidatePath("/admin/schedule");
  revalidatePath("/portal/schedule");
  revalidatePath("/fixtures");
}

export async function exportSchedule(): Promise<string> {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const events = await prisma.scheduleEvent.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { team: true },
    orderBy: { startsAt: "asc" },
  });
  const headers = ["team", "type", "date", "time", "title", "location", "opponent", "homeScore", "awayScore", "description"];
  const rows = events.map((e) => [
    e.team.name, e.type,
    e.startsAt.toISOString().slice(0, 10), e.startsAt.toISOString().slice(11, 16),
    e.title, e.location ?? "", e.opponent ?? "",
    e.homeScore?.toString() ?? "", e.awayScore?.toString() ?? "", e.description ?? "",
  ]);
  return toCsv(headers, rows);
}
