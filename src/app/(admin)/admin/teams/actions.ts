"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

export async function createTeam(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const ageGroup = String(formData.get("ageGroup") || "").trim();
  const crestUrl = String(formData.get("crestUrl") || "").trim() || null;

  if (!name || !ageGroup) {
    throw new Error("Name and age group are required.");
  }

  const created = await prisma.team.create({ data: { name, ageGroup, crestUrl } });

  await logAudit({
    action: "team.create",
    entityType: "Team",
    entityId: created.id,
    summary: `Created team ${name}`,
    changes: diffFields(null, { name, ageGroup, crestUrl }),
  });

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect("/admin/teams");
}

export async function updateTeam(teamId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const ageGroup = String(formData.get("ageGroup") || "").trim();
  const crestUrl = String(formData.get("crestUrl") || "").trim() || null;

  if (!name || !ageGroup) {
    throw new Error("Name and age group are required.");
  }

  const before = await prisma.team.findUnique({ where: { id: teamId } });
  if (!before) throw new Error("Team not found.");

  await prisma.team.update({ where: { id: teamId }, data: { name, ageGroup, crestUrl } });

  const changes = diffFields(
    { name: before.name, ageGroup: before.ageGroup, crestUrl: before.crestUrl },
    { name, ageGroup, crestUrl }
  );

  // Saving with no actual changes is not logged, to keep the log free of noise.
  if (Object.keys(changes).length > 0) {
    await logAudit({
      action: "team.update",
      entityType: "Team",
      entityId: teamId,
      summary: `Updated team ${name}`,
      changes,
    });
  }

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect("/admin/teams");
}

export async function deleteTeam(teamId: string) {
  await requireAdmin();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { players: true } } },
  });
  if (!team) return;

  await prisma.team.delete({ where: { id: teamId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "team.delete",
    entityType: "Team",
    entityId: teamId,
    summary: `Deleted team ${team.name}`,
    changes: {
      ...diffFields(
        { name: team.name, ageGroup: team.ageGroup, crestUrl: team.crestUrl },
        { name: null, ageGroup: null, crestUrl: null }
      ),
      playersOnTeamAtDeletion: team._count.players,
    },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
}
