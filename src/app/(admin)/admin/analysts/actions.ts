"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { logAudit, diffFields } from "@/lib/audit";

export async function createAnalyst(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email) throw new Error("Name and email are required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({ data: { name, email, passwordHash, role: "ANALYST" } });

  // The password and hash are deliberately never logged.
  await logAudit({
    action: "analyst.create",
    entityType: "User",
    entityId: created.id,
    summary: `Created analyst account for ${name}`,
    changes: diffFields(null, { name, email, role: "ANALYST" }),
  });

  revalidatePath("/admin/analysts");
  redirect("/admin/analysts");
}

export async function deleteAnalyst(userId: string) {
  await requireAdmin();

  // Guard: this action may only ever remove analyst accounts, never an admin or coach.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ANALYST") return;

  await prisma.user.delete({ where: { id: userId } });

  // Logged after the delete succeeds, using the details captured before it.
  await logAudit({
    action: "analyst.delete",
    entityType: "User",
    entityId: userId,
    summary: `Deleted analyst account for ${user.name}`,
    changes: diffFields(
      { name: user.name, email: user.email, role: user.role },
      { name: null, email: null, role: null }
    ),
  });

  revalidatePath("/admin/analysts");
}
