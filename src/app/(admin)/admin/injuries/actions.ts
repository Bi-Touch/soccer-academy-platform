"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";
import { HEALTH_CONTEXT, encryptField } from "@/lib/healthCrypto";

function dateKey(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function createInjury(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  // The free-text description is medical information about a minor, so it is encrypted before it
  // is saved. If encryption is not set up the injury is NOT saved, rather than saving plain text.
  const description = String(formData.get("description") || "").trim() || null;
  let storedDescription: string | null;
  try {
    storedDescription = encryptField(description, HEALTH_CONTEXT.injuryDescription);
  } catch (e) {
    console.error("Could not encrypt the injury description:", e);
    throw new Error("The injury notes could not be saved securely. Ask an administrator to check the health data encryption key.");
  }

  const created = await prisma.injuryRecord.create({
    data: {
      playerId,
      injuryType: String(formData.get("injuryType") || "").trim(),
      description: storedDescription,
      dateOccurred: new Date(String(formData.get("dateOccurred"))),
      expectedReturnDate: formData.get("expectedReturnDate") ? new Date(String(formData.get("expectedReturnDate"))) : null,
      recordedBy: user.id,
      status: "ACTIVE",
    },
  });

  // The free-text description is medical information about a minor, so it is not copied into the log.
  await logAudit({
    action: "injury.create",
    entityType: "InjuryRecord",
    entityId: created.id,
    playerId,
    summary: `Recorded an injury for ${player.name}`,
    changes: diffFields(null, {
      injuryType: created.injuryType,
      dateOccurred: dateKey(created.dateOccurred),
      expectedReturnDate: dateKey(created.expectedReturnDate),
      status: created.status,
    }),
  });

  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${playerId}/reports`);
  redirect("/admin/injuries");
}

export async function markRecovered(injuryId: string) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const before = await prisma.injuryRecord.findUnique({
    where: { id: injuryId },
    include: { player: true },
  });
  if (!before) throw new Error("Injury record not found.");
  assertTeamAccess(accessibleTeamIds, before.player.teamId);

  const injury = await prisma.injuryRecord.update({
    where: { id: injuryId },
    data: { status: "RECOVERED", actualReturnDate: new Date() },
  });

  await logAudit({
    action: "injury.recovered",
    entityType: "InjuryRecord",
    entityId: injuryId,
    playerId: injury.playerId,
    summary: `Marked injury as recovered for ${before.player.name}`,
    changes: diffFields(
      { status: before.status, actualReturnDate: dateKey(before.actualReturnDate) },
      { status: injury.status, actualReturnDate: dateKey(injury.actualReturnDate) }
    ),
  });

  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${injury.playerId}/reports`);
}