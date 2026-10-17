"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { RegistrationFormData } from "@/lib/registrationTypes";
import { logAudit } from "@/lib/audit";
import { isRateLimited } from "@/lib/rateLimit";

export async function submitPlayerRegistration(data: RegistrationFormData): Promise<{ error: string } | void> {
  // Honeypot: real visitors never see or fill this field, bots usually do. Nothing is saved.
  if ((data as RegistrationFormData & { website_url?: string }).website_url?.trim()) {
    return { error: "Something went wrong. Please try again." };
  }

  if (!data.guardianFirstName?.trim() || !data.guardianLastName?.trim() || !data.guardianRelationship?.trim() || !data.guardianPhone?.trim() || !data.guardianEmail?.trim()) {
    return { error: "Please complete all required guardian fields." };
  }
  if (!data.playerFirstName?.trim() || !data.playerLastName?.trim() || !data.playerDateOfBirth) {
    return { error: "Please complete all required player fields." };
  }
  if (!data.dataProcessing || !data.statistics || !data.guardianDeclaration) {
    return { error: "The required consents and declaration must be accepted to submit a registration." };
  }

  const dob = new Date(data.playerDateOfBirth);
  if (isNaN(dob.getTime())) {
    return { error: "Invalid date of birth." };
  }

  // At most 5 registrations per IP per hour, which still leaves room for a family registering several children.
  if (await isRateLimited("registration.submit", 5, 60)) {
    return { error: "Too many registrations sent from your connection. Please try again later." };
  }

  const email = data.guardianEmail.trim().toLowerCase();

  // Reuse an existing ParentGuardian record for this email so a parent
  // registering a second child doesn't end up with two separate guardian
  // records (and, later, two separate logins).
  let guardian = await prisma.parentGuardian.findFirst({ where: { email } });
  let guardianCreated = false;
  if (!guardian) {
    guardian = await prisma.parentGuardian.create({
      data: {
        firstName: data.guardianFirstName.trim(),
        lastName: data.guardianLastName.trim(),
        relationship: data.guardianRelationship.trim(),
        phone: data.guardianPhone.trim(),
        email,
        address: data.guardianAddress?.trim() || null,
        idNumber: data.guardianIdNumber?.trim() || null,
      },
    });
    guardianCreated = true;
  }

  const registration = await prisma.playerRegistration.create({
    data: {
      parentGuardianId: guardian.id,
      firstName: data.playerFirstName.trim(),
      lastName: data.playerLastName.trim(),
      dateOfBirth: dob,
      gender: data.gender || null,
      nationality: data.nationality?.trim() || null,
      position: data.position || null,
      preferredFoot: data.preferredFoot || null,
      previousClub: data.previousClub?.trim() || null,
      previousAcademy: data.previousAcademy?.trim() || null,
      emergencyName: data.emergencyName?.trim() || null,
      emergencyPhone: data.emergencyPhone?.trim() || null,
      medicalNotes: data.medicalNotes?.trim() || null,
      status: "PENDING",
      consent: {
        create: {
          dataProcessing: data.dataProcessing,
          statistics: data.statistics,
          photography: data.photography,
          videoRecording: data.videoRecording,
          publicMedia: data.publicMedia,
          localScouting: data.localScouting,
          overseasAcademies: data.overseasAcademies,
          overseasClubs: data.overseasClubs,
          scouts: data.scouts,
          agents: data.agents,
          guardianDeclaration: data.guardianDeclaration,
          consentVersion: "1.0",
          consentedAt: new Date(),
        },
      },
    },
  });

  // Public form, so there is no signed-in actor (the request IP is recorded automatically).
  // Contact details, medical notes, ID numbers and the individual consent choices stay in the
  // registration itself and are not copied into the log. Logged before redirect(), which throws.
  await logAudit({
    action: "registration.submit",
    entityType: "PlayerRegistration",
    entityId: registration.id,
    summary: `New registration submitted for ${registration.firstName} ${registration.lastName}`,
    changes: {
      status: "PENDING",
      guardianId: guardian.id,
      newGuardianRecord: guardianCreated,
      consentVersion: "1.0",
    },
  });

  redirect(`/register/player/success?id=${registration.id}`);
}
