"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

function dateKey(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function createInjury(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const created = await prisma.injuryRecord.create({
    data: {
      playerId,
      injuryType: String(formData.get("injuryType") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
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
    summary: `Marked injury as recovered for ${before.player.name}`,
    changes: diffFields(
      { status: before.status, actualReturnDate: dateKey(before.actualReturnDate) },
      { status: injury.status, actualReturnDate: dateKey(injury.actualReturnDate) }
    ),
  });

  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${injury.playerId}/reports`);
}
