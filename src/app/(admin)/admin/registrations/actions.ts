"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { ConsentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { sendRegistrationApprovedEmail, sendPlayerAddedEmail } from "@/lib/notifications";
import { logAudit, diffFields } from "@/lib/audit";
import { setFlashPassword } from "@/lib/flashPassword";
import { HEALTH_CONTEXT, decryptField, encryptField } from "@/lib/healthCrypto";

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 10);
}

export async function approveRegistration(registrationId: string) {
  const admin = await requireAdmin();

  const registration = await prisma.playerRegistration.findUnique({
    where: { id: registrationId },
    include: { parentGuardian: true, consent: true },
  });
  if (!registration) throw new Error("Registration not found.");
  if (registration.status === "APPROVED") throw new Error("Registration already approved.");
  if (!registration.consent) {
    throw new Error("This registration has no consent record, so it cannot be approved.");
  }

  const consent = registration.consent;
  const guardian = registration.parentGuardian;
  const playerFullName = `${registration.firstName} ${registration.lastName}`;

  // The registration form only offers MALE or FEMALE, which matches the Sex enum.
  const sex =
    registration.gender === "MALE" ? "MALE" : registration.gender === "FEMALE" ? "FEMALE" : null;

  // What the parent decided at registration, one row per consent type. Explicit "no"
  // rows are kept on purpose: they show the choice was offered and declined.
  // Registrations made before the form was split into local and overseas have only the
  // legacy scouts/agents ticks, and those are treated as LOCAL ONLY.
  const consentRows: { type: ConsentType; granted: boolean }[] = [
    { type: "PHOTOGRAPHY", granted: consent.photography },
    { type: "VIDEO", granted: consent.videoRecording },
    { type: "PUBLIC_MEDIA", granted: consent.publicMedia },
    { type: "SCOUTING_LOCAL", granted: consent.localScouting || consent.scouts },
    { type: "AGENTS_LOCAL", granted: consent.localAgents || consent.agents },
    { type: "SCOUTING_OVERSEAS_ACADEMIES", granted: consent.overseasAcademies },
    { type: "SCOUTING_OVERSEAS_CLUBS", granted: consent.overseasClubs },
    { type: "SCOUTING_OVERSEAS_SCOUTS", granted: consent.overseasScouts },
    { type: "SCOUTING_OVERSEAS_AGENTS", granted: consent.overseasAgents },
    { type: "HEALTH_DATA", granted: consent.healthData },
    { type: "MARKETING_COMMUNICATIONS", granted: consent.marketingCommunications },
  ];

  let tempPassword: string | null = null;
  let guardianUserId = guardian.userId;

  const result = await prisma.$transaction(
    async (tx) => {
      // Claim the registration first. If two admins click Approve at the same time,
      // only one gets past this point, so a child is never created twice.
      const claimed = await tx.playerRegistration.updateMany({
        where: { id: registration.id, status: { not: "APPROVED" } },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: admin.id },
      });
      if (claimed.count === 0) throw new Error("Registration already approved.");

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
          sex,
          position: registration.position,
          parentGuardianId: guardian.id,
        },
      });

      // Consent ledger. Timestamps are when the parent actually consented, not when
      // the Academy approved, so the record reflects what the parent saw and agreed to.
      await tx.playerConsent.createMany({
        data: consentRows.map((row) => ({
          playerId: player.id,
          type: row.type,
          granted: row.granted,
          givenById: guardian.id,
          givenByRole: "GUARDIAN" as const,
          source: "REGISTRATION" as const,
          formVersion: consent.consentVersion,
          policyVersion: consent.policyVersion ?? "legacy",
          consentRecordId: consent.id,
          createdAt: consent.consentedAt,
        })),
      });

      if (registration.emergencyName && registration.emergencyPhone) {
        await tx.emergencyContact.create({
          data: {
            playerId: player.id,
            name: registration.emergencyName,
            // Registrations made before the relationship field existed have none.
            relationship: registration.emergencyRelationship || "Not stated",
            phone: registration.emergencyPhone,
            isPrimary: true,
          },
        });
      }

      // Health data moves into its own protected record. Medical notes are only
      // imported when the parent gave health-data consent. Older registrations
      // (made before that consent existed) keep their notes on the registration
      // so an administrator can ask the parent to confirm, instead of silently
      // copying health information without consent.
      // Stored encrypted on the registration; decrypted here only to move it into the health profile.
      const notes = decryptField(registration.medicalNotes, HEALTH_CONTEXT.registrationNotes)?.trim() || null;
      const importNotes = Boolean(notes) && consent.healthData;

      await tx.playerHealthProfile.create({
        data: {
          playerId: player.id,
          notes: importNotes ? encryptField(notes, HEALTH_CONTEXT.profileNotes) : null,
          emergencyTreatmentAuthorised: consent.emergencyTreatmentAuthorised,
          authorisedAt: consent.emergencyTreatmentAuthorised ? consent.consentedAt : null,
          updatedById: admin.id,
        },
      });

      await tx.playerRegistration.update({
        where: { id: registration.id },
        data: {
          createdPlayerId: player.id,
          // Health data should live in one place, so clear it here once it has moved.
          ...(importNotes ? { medicalNotes: null } : {}),
        },
      });

      return {
        playerId: player.id,
        seededConsents: consentRows.length,
        healthNotesImported: importNotes,
        healthNotesNeedFollowUp: Boolean(notes) && !importNotes,
      };
    },
    { timeout: 15000 }
  );

  // The temporary password is deliberately never logged. Medical notes and the
  // individual consent choices are not copied into the log either.
  await logAudit({
    action: "registration.approve",
    entityType: "PlayerRegistration",
    entityId: registration.id,
    summary: `Approved registration for ${playerFullName}`,
    changes: {
      ...diffFields({ status: registration.status }, { status: "APPROVED" }),
      createdPlayerId: result.playerId,
      guardianLoginCreated: !guardian.userId,
      consentRowsSeeded: result.seededConsents,
      healthNotesImported: result.healthNotesImported,
      healthNotesNeedFollowUp: result.healthNotesNeedFollowUp,
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

  // The password travels in a short-lived httpOnly cookie, not in the URL.
  if (tempPassword) {
    await setFlashPassword({ password: tempPassword, email: guardian.email, registrationId: registration.id });
  }
  redirect(`/admin/registrations/${registration.id}`);
}

export async function rejectRegistration(registrationId: string, formData: FormData) {
  const admin = await requireAdmin();
  const reviewNotes = String(formData.get("reviewNotes") || "").trim() || null;

  const before = await prisma.playerRegistration.findUnique({ where: { id: registrationId } });
  if (!before) throw new Error("Registration not found.");

  await prisma.playerRegistration.update({
    where: { id: registrationId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id, reviewNotes },
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
  const admin = await requireAdmin();
  const reviewNotes = String(formData.get("reviewNotes") || "").trim() || null;

  const before = await prisma.playerRegistration.findUnique({ where: { id: registrationId } });
  if (!before) throw new Error("Registration not found.");

  await prisma.playerRegistration.update({
    where: { id: registrationId },
    data: { status: "CHANGES_REQUESTED", reviewedAt: new Date(), reviewedById: admin.id, reviewNotes },
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

  // The password travels in a short-lived httpOnly cookie, not in the URL.
  await setFlashPassword({ password: tempPassword, email: guardian.email });
  redirect("/admin/registrations");
}
