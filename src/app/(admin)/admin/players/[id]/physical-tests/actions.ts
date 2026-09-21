"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, getAccessibleTeamIds, assertTeamAccess } from "@/lib/permissions";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";

export async function createPhysicalTest(playerId: string, formData: FormData) {
  const user = await requireStaff();
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");
  assertTeamAccess(accessibleTeamIds, player.teamId);

  const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
  const testedAtRaw = String(formData.get("testedAt") || "");

  const results: { metric: string; value: number; unit: string }[] = [];
  for (const m of PHYSICAL_TEST_METRICS) {
    const raw = String(formData.get(`value_${m.key}`) || "").trim();
    if (raw) {
      results.push({ metric: m.label, value: parseFloat(raw), unit: m.unit });
    }
  }

  await prisma.physicalTest.create({
    data: {
      playerId,
      testedAt: testedAtRaw ? new Date(testedAtRaw) : new Date(),
      testedBy: staffUser?.name ?? null,
      results: { create: results },
    },
  });

  revalidatePath(`/admin/players/${playerId}/physical-tests`);
  redirect(`/admin/players/${playerId}/physical-tests`);
}