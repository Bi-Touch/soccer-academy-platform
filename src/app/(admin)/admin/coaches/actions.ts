"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCoach(formData: FormData) {
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

  await prisma.user.create({
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
  });

  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  redirect("/admin/coaches");
}

export async function updateCoach(coachId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;
  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);

  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
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

  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  redirect("/admin/coaches");
}

export async function deleteCoach(coachId: string) {
  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) return;
  await prisma.user.delete({ where: { id: coach.userId } }); // cascades to Coach
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
}