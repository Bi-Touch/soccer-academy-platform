"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { setFlashPassword } from "@/lib/flashPassword";

import { ROLE_LABEL, isCareRole } from "./staff-config";

const BACK = "/admin/staff";

/**
 * Generates a temporary password for staff accounts.
 * The password is returned only to the caller and is not logged.
 */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

/**
 * Reads and normalizes a string from submitted form data.
 */
function text(
  formData: FormData,
  key: string,
  max: number
): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

/**
 * Creates a safeguarding lead or medical officer account.
 *
 * The temporary password is made available through the existing
 * short-lived flash-password mechanism.
 */
export async function createStaffAccount(
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const name = text(formData, "name", 100);
  const email = text(formData, "email", 254).toLowerCase();
  const role = text(formData, "role", 30);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !validEmail) {
    redirect(`${BACK}?error=details`);
  }

  if (!isCareRole(role)) {
    redirect(`${BACK}?error=role`);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    redirect(`${BACK}?error=exists`);
  }

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
  });

  await logAudit({
    action: "staff.create",
    entityType: "User",
    entityId: user.id,
    summary: `Created a ${ROLE_LABEL[role]} account for ${name}`,
    changes: { role },
  });

  await setFlashPassword({
    password,
    email,
    registrationId: `staff:${user.id}`,
  });

  revalidatePath(BACK);

  redirect(`${BACK}?credentials=${user.id}`);
}

/**
 * Resets the password for a safeguarding lead or medical officer.
 */
export async function resetStaffPassword(
  userId: string
): Promise<void> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user || !isCareRole(user.role)) {
    redirect(`${BACK}?error=person`);
  }

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await logAudit({
    action: "staff.password.reset",
    entityType: "User",
    entityId: user.id,
    summary: `Reset the password for ${user.name}`,
  });

  await setFlashPassword({
    password,
    email: user.email,
    registrationId: `staff:${user.id}`,
  });

  revalidatePath(BACK);

  redirect(`${BACK}?credentials=${user.id}`);
}

/**
 * Removes safeguarding or medical access without deleting the user.
 *
 * Open safeguarding concerns assigned to the removed staff member
 * are unassigned. The final safeguarding lead cannot be removed while
 * any safeguarding concern remains open.
 */
export async function removeStaffAccess(
  userId: string
): Promise<void> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!user || !isCareRole(user.role)) {
    redirect(`${BACK}?error=person`);
  }

  if (user.role === "SAFEGUARDING_LEAD") {
    const [leads, openConcerns] = await Promise.all([
      prisma.user.count({
        where: { role: "SAFEGUARDING_LEAD" },
      }),
      prisma.safeguardingConcern.count({
        where: { status: { not: "CLOSED" } },
      }),
    ]);

    if (leads <= 1 && openConcerns > 0) {
      redirect(`${BACK}?error=lastLead`);
    }
  }

  const unusableHash = await bcrypt.hash(
    crypto.randomBytes(32).toString("base64url"),
    12
  );

  const unassigned = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        role: "PLAYER",
        passwordHash: unusableHash,
      },
    });

    const result = await tx.safeguardingConcern.updateMany({
      where: {
        assignedToId: user.id,
        status: { not: "CLOSED" },
      },
      data: {
        assignedToId: null,
      },
    });

    return result.count;
  });

  await logAudit({
    action: "staff.access.removed",
    entityType: "User",
    entityId: user.id,
    summary: `Removed ${ROLE_LABEL[user.role]} access for ${user.name}`,
    changes: {
      previousRole: user.role,
      concernsUnassigned: unassigned,
    },
  });

  revalidatePath(BACK);
  revalidatePath("/admin/safeguarding");

  redirect(`${BACK}?removed=1`);
}