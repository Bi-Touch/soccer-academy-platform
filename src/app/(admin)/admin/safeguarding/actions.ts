"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  assertTeamAccess,
  getAccessibleTeamIds,
  requireConcernReporter,
  requireSafeguardingLead,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { HEALTH_CONTEXT, encryptField } from "@/lib/healthCrypto";
import {
  VIEW_REASONS,
  isCategory,
  isClearanceType,
  isStatus,
  isViewReason,
} from "@/lib/safeguarding";

const REPORT = "/admin/safeguarding/report";

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/**
 * Any adult who works with players can raise a concern. They can write it but cannot read it
 * back afterwards: only the safeguarding lead can open it. The description is encrypted, and the
 * audit entry records that a concern was raised, not who it is about or what it says.
 */
export async function raiseConcern(formData: FormData): Promise<void> {
  const user = await requireConcernReporter();

  const category = text(formData, "category", 40);
  if (!isCategory(category)) redirect(`${REPORT}?error=category`);

  const description = text(formData, "description", 5000);
  if (description.length < 10) redirect(`${REPORT}?error=description`);

  // Coaches can link a concern to a child on their own teams. For anyone else, they name the
  // person in the description (an observation about a child from another team is still welcome).
  const playerIdRaw = text(formData, "playerId", 60);
  let playerId: string | null = null;
  if (playerIdRaw) {
    const player = await prisma.player.findUnique({ where: { id: playerIdRaw }, select: { id: true, teamId: true } });
    if (!player) redirect(`${REPORT}?error=player`);
    if (user.role === "COACH") {
      try {
        assertTeamAccess(await getAccessibleTeamIds(user), player.teamId);
      } catch {
        redirect(`${REPORT}?error=player`);
      }
    }
    playerId = player.id;
  }

  const incidentOn = text(formData, "incidentOn", 10);
  const dateLine = incidentOn && !Number.isNaN(Date.parse(incidentOn)) ? `Date of incident: ${incidentOn}\n\n` : "";

  let encrypted: string | null;
  try {
    encrypted = encryptField(dateLine + description, HEALTH_CONTEXT.concernDescription);
  } catch (e) {
    console.error("Could not encrypt a safeguarding concern:", e);
    // Nothing is saved in plain text. The reporter is told to go to the lead directly.
    redirect(`${REPORT}?error=secure`);
  }
  if (!encrypted) redirect(`${REPORT}?error=description`);

  const concern = await prisma.safeguardingConcern.create({
    data: {
      playerId,
      reportedById: user.id,
      category,
      description: encrypted,
      status: "OPEN",
    },
  });

  await logAudit({
    action: "safeguarding.raise",
    entityType: "SafeguardingConcern",
    entityId: concern.id,
    summary: "A safeguarding concern was raised",
  });

  revalidatePath("/admin/safeguarding");
  redirect(`${REPORT}?raised=${concern.id.slice(-6).toUpperCase()}`);
}

/**
 * Lead only. The record is append-only: nothing is edited or deleted. Every change adds a dated
 * note (encrypted) to the timeline. Closing needs an outcome; reopening needs a note.
 */
export async function updateConcern(concernId: string, formData: FormData): Promise<void> {
  const lead = await requireSafeguardingLead();

  const concern = await prisma.safeguardingConcern.findUnique({ where: { id: concernId } });
  if (!concern) notFound();

  const reasonRaw = text(formData, "reason", 20);
  const reason = isViewReason(reasonRaw) ? reasonRaw : "follow_up";
  const back = `/admin/safeguarding/${concern.id}?reason=${reason}`;

  const note = text(formData, "note", 5000);
  const statusRaw = text(formData, "status", 30);
  const newStatus = isStatus(statusRaw) ? statusRaw : concern.status;
  const assignRaw = text(formData, "assignedToId", 60);
  const outcome = text(formData, "outcome", 5000);

  let assignedToId = concern.assignedToId;
  let assignedName: string | null = null;
  if (formData.has("assignedToId")) {
    if (assignRaw === "") {
      assignedToId = null;
    } else {
      const assignee = await prisma.user.findUnique({ where: { id: assignRaw }, select: { id: true, name: true, role: true } });
      if (!assignee || assignee.role !== "SAFEGUARDING_LEAD") redirect(`${back}&error=assignee`);
      assignedToId = assignee.id;
      assignedName = assignee.name;
    }
  }

  const closing = newStatus === "CLOSED" && concern.status !== "CLOSED";
  const reopening = concern.status === "CLOSED" && newStatus !== "CLOSED";
  const statusChanged = newStatus !== concern.status;
  const assignmentChanged = assignedToId !== concern.assignedToId;

  if (closing && outcome.length < 10) redirect(`${back}&error=outcome`);
  if (reopening && note.length < 10) redirect(`${back}&error=reopen`);

  const lines: string[] = [];
  if (statusChanged) lines.push(`Status changed from ${concern.status} to ${newStatus}.`);
  if (assignmentChanged) lines.push(assignedToId ? `Assigned to ${assignedName ?? "another lead"}.` : "Unassigned.");
  if (closing) lines.push("Closed. The outcome has been recorded.");
  if (note) lines.push(note);
  if (lines.length === 0) redirect(`${back}&error=empty`);

  let encryptedNote: string | null;
  let encryptedOutcome: string | null = null;
  try {
    encryptedNote = encryptField(lines.join("\n"), HEALTH_CONTEXT.concernNote);
    if (closing) encryptedOutcome = encryptField(outcome, HEALTH_CONTEXT.concernOutcome);
  } catch (e) {
    console.error("Could not encrypt a safeguarding update:", e);
    redirect(`${back}&error=secure`);
  }
  if (!encryptedNote) redirect(`${back}&error=empty`);

  await prisma.$transaction(async (tx) => {
    await tx.safeguardingConcern.update({
      where: { id: concern.id },
      data: {
        status: newStatus,
        assignedToId,
        ...(closing ? { outcome: encryptedOutcome, closedAt: new Date() } : {}),
        ...(reopening ? { closedAt: null } : {}),
      },
    });
    await tx.safeguardingAction.create({
      data: { concernId: concern.id, actorId: lead.id, note: encryptedNote },
    });
  });

  // Flags only: what changed, never what was written.
  await logAudit({
    action: "safeguarding.update",
    entityType: "SafeguardingConcern",
    entityId: concern.id,
    reason: VIEW_REASONS[reason],
    summary: "A safeguarding record was updated",
    changes: { statusChanged, assignmentChanged, noteAdded: note.length > 0, closed: closing, reopened: reopening },
  });

  revalidatePath("/admin/safeguarding");
  redirect(`${back}&saved=1`);
}

/** Lead only. Records a staff vetting or training item. Older records are kept as history. */
export async function saveClearance(formData: FormData): Promise<void> {
  const lead = await requireSafeguardingLead();
  const back = "/admin/safeguarding/clearances";

  const userId = text(formData, "userId", 60);
  const typeRaw = text(formData, "type", 40);
  const issuedOn = text(formData, "issuedOn", 10);
  const expiresOn = text(formData, "expiresOn", 10);
  const documentRef = text(formData, "documentRef", 200) || null;

  if (!isClearanceType(typeRaw)) redirect(`${back}?error=type`);
  const issuedAt = new Date(`${issuedOn}T12:00:00.000Z`);
  if (!issuedOn || Number.isNaN(issuedAt.getTime()) || issuedAt.getTime() > Date.now() + 86400000) {
    redirect(`${back}?error=date`);
  }
  let expiresAt: Date | null = null;
  if (expiresOn) {
    expiresAt = new Date(`${expiresOn}T12:00:00.000Z`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= issuedAt.getTime()) redirect(`${back}?error=expiry`);
  }

  const person = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!person || !["ADMIN", "COACH", "MEDICAL_OFFICER", "SAFEGUARDING_LEAD"].includes(person.role)) {
    redirect(`${back}?error=person`);
  }

  await prisma.staffClearance.create({
    data: { userId: person.id, type: typeRaw, issuedAt, expiresAt, documentRef, verifiedById: lead.id },
  });

  // This concerns staff vetting, not any child, so it is logged normally.
  await logAudit({
    action: "clearance.record",
    entityType: "StaffClearance",
    entityId: person.id,
    summary: `Recorded a staff clearance (${typeRaw})`,
  });

  revalidatePath(back);
  redirect(`${back}?saved=1`);
}
