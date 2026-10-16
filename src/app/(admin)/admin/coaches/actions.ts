"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

export async function createCoach(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const title = String(formData.get("title") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "COACH",
      coach: {
        create: {
          title,
          bio,
          photoUrl,
          teams: { connect: teamIds.map((id) => ({ id })) },
        },
      },
    },
    include: { coach: true },
  });

  // The password and hash are deliberately never logged.
  await logAudit({
    action: "coach.create",
    entityType: "Coach",
    entityId: created.coach?.id ?? created.id,
    summary: `Created coach ${name}`,
    changes: diffFields(null, { name, email, title, bio, photoUrl, teamIds: [...teamIds].sort() }),
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  redirect("/admin/coaches");
}

export async function updateCoach(coachId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: { user: true, teams: true },
  });
  if (!coach) throw new Error("Coach not found.");

  await prisma.coach.update({
    where: { id: coachId },
    data: {
      title,
      bio,
      photoUrl,
      teams: { set: teamIds.map((id) => ({ id })) },
    },
  });

  if (name) {
    await prisma.user.update({ where: { id: coach.userId }, data: { name } });
  }

  // Must run before redirect(), which throws and stops anything after it.
  await logAudit({
    action: "coach.update",
    entityType: "Coach",
    entityId: coachId,
    summary: `Updated coach ${name || coach.user.name}`,
    changes: diffFields(
      {
        name: coach.user.name,
        title: coach.title,
        bio: coach.bio,
        photoUrl: coach.photoUrl,
        teamIds: coach.teams.map((t) => t.id).sort(),
      },
      {
        name: name || coach.user.name,
        title,
        bio,
        photoUrl,
        teamIds: [...teamIds].sort(),
      }
    ),
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  redirect("/admin/coaches");
}

export async function deleteCoach(coachId: string) {
  await requireAdmin();

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: { user: true },
  });
  if (!coach) return;

  await prisma.user.delete({ where: { id: coach.userId } }); // cascades to Coach

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "coach.delete",
    entityType: "Coach",
    entityId: coachId,
    summary: `Deleted coach ${coach.user.name}`,
    changes: diffFields(
      { name: coach.user.name, email: coach.user.email, title: coach.title },
      { name: null, email: null, title: null }
    ),
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
}
