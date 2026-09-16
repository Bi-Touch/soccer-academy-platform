"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTeam(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const ageGroup = String(formData.get("ageGroup") || "").trim();
  const crestUrl = String(formData.get("crestUrl") || "").trim() || null;

  if (!name || !ageGroup) {
    throw new Error("Name and age group are required.");
  }

  await prisma.team.create({ data: { name, ageGroup, crestUrl } });

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect("/admin/teams");
}

export async function updateTeam(teamId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const ageGroup = String(formData.get("ageGroup") || "").trim();
  const crestUrl = String(formData.get("crestUrl") || "").trim() || null;

  if (!name || !ageGroup) {
    throw new Error("Name and age group are required.");
  }

  await prisma.team.update({ where: { id: teamId }, data: { name, ageGroup, crestUrl } });

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  redirect("/admin/teams");
}

export async function deleteTeam(teamId: string) {
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
}