"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { sendRegistrationApprovedEmail, sendPlayerAddedEmail } from "@/lib/notifications";
import { logAudit, diffFields } from "@/lib/audit";

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 10);
}

export async function approveRegistration(registrationId: string) {
  await requireAdmin();

  const registration = await prisma.playerRegistration.findUnique({
    where: { id: registrationId },
    include: { parentGuardian: true },
  });
  if (!registration) throw new Error("Registration not found.");
  if (registration.status === "APPROVED") throw new Error("Registration already approved.");

  const guardian = registration.parentGuardian;
  const playerFullName = `${registration.firstName} ${registration.lastName}`;

  let tempPassword: string | null = null;
  let guardianUserId = guardian.userId;

  const createdPlayerId = await prisma.$transaction(async (tx) => {
    if (!guardianUserId) {
      // First approval for this guardian — check the email isn't already
      // in use by an unrelated account before creating a login.
      const existingUser = await tx.user.findUnique({ where: { email: guardian.email } });
      if (existingUser) {
        throw new Error(`Email ${guardian.email} is already in use by another account. Resolve this manually before approving.`);
      }

      tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await tx.user.create({
        data: { email: guardian.email, passwordHash, name: `${guardian.firstName} ${guardian.lastName}`, role: "PARENT" },
      });
      await tx.parentGuardian.update({ where: { id: guardian.id }, data: { userId: user.id } });
      guardianUserId = user.id;
    }

    const player = await tx.player.create({
      data: {
        name: playerFullName,
        dateOfBirth: registration.dateOfBirth,
        position: registration.position,
        parentGuardianId: guardian.id,
      },
    });

    await tx.playerRegistration.update({
      where: { id: registration.id },
      data: { status: "APPROVED", reviewedAt: new Date(), createdPlayerId: player.id },
    });

    return player.id;
  });

  // The temporary password is deliberately never logged.
  await logAudit({
    action: "registration.approve",
    entityType: "PlayerRegistration",
    entityId: registration.id,
    summary: `Approved registration for ${playerFullName}`,
    changes: {
      ...diffFields({ status: registration.status }, { status: "APPROVED" }),
      createdPlayerId,
      guardianLoginCreated: !guardian.userId,
    },
  });

  try {
    if (tempPassword) {
      await sendRegistrationApprovedEmail(guardian.email, guardian.firstName, playerFullName, guardian.email, tempPassword);
    } else {
      await sendPlayerAddedEmail(guardian.email, guardian.firstName, playerFullName);
    }
  } catch (e) {
    console.error("Approval succeeded but notification email failed:", e);
  }

  revalidatePath("/admin/registrations");

  if (tempPassword) {
    redirect(`/admin/registrations/${registration.id}?tempPassword=${encodeURIComponent(tempPassword)}`);
  }
  redirect(`/admin/registrations/${registration.id}`);
}

export async function rejectRegistration(registrationId: string, formData: FormData) {
  await requireAdmin();
  const reviewNotes = String(formData.get("reviewNotes") || "").trim() || null;

  const before = await prisma.playerRegistration.findUnique({ where: { id: registrationId } });
  if (!before) throw new Error("Registration not found.");

  await prisma.playerRegistration.update({
    where: { id: registrationId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewNotes },
  });

  // Review notes are free text about a child and family, so only whether notes were added is logged.
  await logAudit({
    action: "registration.reject",
    entityType: "PlayerRegistration",
    entityId: registrationId,
    summary: `Rejected registration for ${before.firstName} ${before.lastName}`,
    changes: {
      ...diffFields({ status: before.status }, { status: "REJECTED" }),
      hasReviewNotes: Boolean(reviewNotes),
    },
  });

  revalidatePath("/admin/registrations");
  redirect("/admin/registrations");
}

export async function requestChanges(registrationId: string, formData: FormData) {
  await requireAdmin();
  const reviewNotes = String(formData.get("reviewNotes") || "").trim() || null;

  const before = await prisma.playerRegistration.findUnique({ where: { id: registrationId } });
  if (!before) throw new Error("Registration not found.");

  await prisma.playerRegistration.update({
    where: { id: registrationId },
    data: { status: "CHANGES_REQUESTED", reviewedAt: new Date(), reviewNotes },
  });

  await logAudit({
    action: "registration.changesRequested",
    entityType: "PlayerRegistration",
    entityId: registrationId,
    summary: `Requested changes to registration for ${before.firstName} ${before.lastName}`,
    changes: {
      ...diffFields({ status: before.status }, { status: "CHANGES_REQUESTED" }),
      hasReviewNotes: Boolean(reviewNotes),
    },
  });

  revalidatePath("/admin/registrations");
  redirect("/admin/registrations");
}

export async function resetGuardianPassword(guardianId: string) {
  await requireAdmin();

  const guardian = await prisma.parentGuardian.findUnique({ where: { id: guardianId } });
  if (!guardian) throw new Error("Guardian not found.");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  if (guardian.userId) {
    await prisma.user.update({ where: { id: guardian.userId }, data: { passwordHash } });
  } else {
    const user = await prisma.user.create({
      data: { email: guardian.email, passwordHash, name: `${guardian.firstName} ${guardian.lastName}`, role: "PARENT" },
    });
    await prisma.parentGuardian.update({ where: { id: guardian.id }, data: { userId: user.id } });
  }

  // The new password and hash are deliberately never logged, only the fact of the reset.
  await logAudit({
    action: "guardian.password.reset",
    entityType: "ParentGuardian",
    entityId: guardianId,
    summary: `Reset the login password for guardian ${guardian.firstName} ${guardian.lastName}`,
    changes: { email: guardian.email, loginCreated: !guardian.userId },
  });

  redirect(`/admin/registrations?resetGuardianEmail=${encodeURIComponent(guardian.email)}&tempPassword=${encodeURIComponent(tempPassword)}`);
}
