"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";

export async function createInjury(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  await prisma.injuryRecord.create({
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

  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${playerId}/reports`);
  redirect("/admin/injuries");
}

export async function markRecovered(injuryId: string) {
  await requireStaff();
  const injury = await prisma.injuryRecord.update({
    where: { id: injuryId },
    data: { status: "RECOVERED", actualReturnDate: new Date() },
  });
  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${injury.playerId}/reports`);
}