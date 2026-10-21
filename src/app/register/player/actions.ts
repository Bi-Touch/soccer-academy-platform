"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { POSITIONS } from "@/lib/positions";
import {
  GUARDIAN_RELATIONSHIPS,
  ageInYears,
  type RegistrationFormData,
} from "@/lib/registrationTypes";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";
import { logAudit } from "@/lib/audit";
import { isRateLimited } from "@/lib/rateLimit";
import { HEALTH_CONTEXT, encryptField } from "@/lib/healthCrypto";

const MAX_LENGTH = {
  name: 100,
  phone: 30,
  email: 254,
  address: 300,
  notes: 2000,
} as const;

// Everything arriving here comes from the browser and can be forged, so each
// value is checked for type and length instead of trusting the form's checks.
function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function yes(value: unknown): boolean {
  return value === true;
}

function phoneLooksValid(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^[+\d\s()-]+$/.test(phone) && digits.length >= 9 && digits.length <= 15;
}

function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitPlayerRegistration(
  raw: RegistrationFormData
): Promise<{ error: string } | void> {
  // Honeypot: real visitors never see or fill this field, bots usually do. Nothing is saved.
  if (str((raw as RegistrationFormData & { website_url?: string }).website_url)) {
    return { error: "Something went wrong. Please try again." };
  }

  const f = {
    guardianFirstName: str(raw.guardianFirstName),
    guardianLastName: str(raw.guardianLastName),
    guardianRelationship: str(raw.guardianRelationship),
    guardianPhone: str(raw.guardianPhone),
    guardianEmail: str(raw.guardianEmail).toLowerCase(),
    guardianAddress: str(raw.guardianAddress),

    playerFirstName: str(raw.playerFirstName),
    playerLastName: str(raw.playerLastName),
    playerDateOfBirth: str(raw.playerDateOfBirth),
    gender: str(raw.gender),
    nationality: str(raw.nationality),
    position: str(raw.position),
    preferredFoot: str(raw.preferredFoot),
    previousClub: str(raw.previousClub),
    previousAcademy: str(raw.previousAcademy),

    emergencyName: str(raw.emergencyName),
    emergencyPhone: str(raw.emergencyPhone),
    emergencyRelationship: str(raw.emergencyRelationship),
    medicalNotes: str(raw.medicalNotes),
  };

  const c = {
    dataProcessing: yes(raw.dataProcessing),
    statistics: yes(raw.statistics),
    emergencyTreatmentAuthorised: yes(raw.emergencyTreatmentAuthorised),
    healthData: yes(raw.healthData),
    photography: yes(raw.photography),
    videoRecording: yes(raw.videoRecording),
    publicMedia: yes(raw.publicMedia),
    localScouting: yes(raw.localScouting),
    localAgents: yes(raw.localAgents),
    overseasAcademies: yes(raw.overseasAcademies),
    overseasClubs: yes(raw.overseasClubs),
    overseasScouts: yes(raw.overseasScouts),
    overseasAgents: yes(raw.overseasAgents),
    marketingCommunications: yes(raw.marketingCommunications),
    guardianDeclaration: yes(raw.guardianDeclaration),
  };

  // Guardian
  if (
    !f.guardianFirstName ||
    !f.guardianLastName ||
    !f.guardianRelationship ||
    !f.guardianPhone ||
    !f.guardianEmail
  ) {
    return { error: "Please complete all required guardian fields." };
  }
  if (!(GUARDIAN_RELATIONSHIPS as readonly string[]).includes(f.guardianRelationship)) {
    return { error: "Please choose your relationship to the player from the list." };
  }
  if (!emailLooksValid(f.guardianEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (!phoneLooksValid(f.guardianPhone)) {
    return { error: "Please enter a valid phone number." };
  }

  // Player
  if (!f.playerFirstName || !f.playerLastName || !f.playerDateOfBirth) {
    return { error: "Please complete all required player fields." };
  }
  const age = ageInYears(f.playerDateOfBirth);
  if (age === null) {
    return { error: "Invalid date of birth." };
  }
  if (age < 0) {
    return { error: "The date of birth cannot be in the future." };
  }
  if (age >= 18) {
    return {
      error:
        "Players aged 18 or over register and give their own consent, so a parent or guardian cannot submit this form for them. Please contact the Academy.",
    };
  }

  // Emergency contact
  if (!f.emergencyName || !f.emergencyPhone || !f.emergencyRelationship) {
    return { error: "Please provide an emergency contact name, phone number and relationship." };
  }
  if (!phoneLooksValid(f.emergencyPhone)) {
    return { error: "Please enter a valid emergency contact phone number." };
  }

  // Length limits
  const tooLong =
    [f.guardianFirstName, f.guardianLastName, f.playerFirstName, f.playerLastName, f.emergencyName, f.emergencyRelationship, f.nationality, f.previousClub, f.previousAcademy].some(
      (v) => v.length > MAX_LENGTH.name
    ) ||
    [f.guardianPhone, f.emergencyPhone].some((v) => v.length > MAX_LENGTH.phone) ||
    f.guardianEmail.length > MAX_LENGTH.email ||
    f.guardianAddress.length > MAX_LENGTH.address ||
    f.medicalNotes.length > MAX_LENGTH.notes;
  if (tooLong) {
    return { error: "One of the fields is too long. Please shorten it and try again." };
  }

  // Required consents, enforced on the server
  if (!c.dataProcessing || !c.statistics || !c.emergencyTreatmentAuthorised || !c.guardianDeclaration) {
    return { error: "The required acknowledgements, emergency treatment authorisation and guardian declaration must be accepted to submit a registration." };
  }
  if (f.medicalNotes && !c.healthData) {
    return { error: "Please consent to the Academy storing the player's health information, or remove the medical notes." };
  }

  // At most 5 registrations per IP per hour, which still leaves room for a family registering several children.
  if (await isRateLimited("registration.submit", 5, 60)) {
    return { error: "Too many registrations sent from your connection. Please try again later." };
  }

  const dob = new Date(f.playerDateOfBirth);
  const gender = ["MALE", "FEMALE"].includes(f.gender) ? f.gender : null;
  const preferredFoot = ["LEFT", "RIGHT", "BOTH"].includes(f.preferredFoot) ? f.preferredFoot : null;
  const position = (POSITIONS as readonly string[]).includes(f.position) ? f.position : null;

  // Medical notes are encrypted before they reach the database. If encryption is not set up the
  // registration is refused with a clear message, rather than saving health data as plain text.
  let encryptedMedicalNotes: string | null = null;
  try {
    encryptedMedicalNotes = encryptField(f.medicalNotes, HEALTH_CONTEXT.registrationNotes);
  } catch (e) {
    console.error("Could not encrypt medical notes:", e);
    return { error: "We could not save the medical notes securely. Please try again later or contact the Academy." };
  }

  // One transaction, so a failure never leaves a guardian record without a registration.
  // An existing ParentGuardian with the same email is reused so a parent registering a
  // second child doesn't end up with two guardian records (and, later, two logins).
  const { registration, guardian, guardianCreated } = await prisma.$transaction(async (tx) => {
    let existing = await tx.parentGuardian.findFirst({ where: { email: f.guardianEmail } });
    let created = false;

    if (!existing) {
      existing = await tx.parentGuardian.create({
        data: {
          firstName: f.guardianFirstName,
          lastName: f.guardianLastName,
          relationship: f.guardianRelationship,
          phone: f.guardianPhone,
          email: f.guardianEmail,
          address: f.guardianAddress || null,
          // The guardian ID/passport number is no longer collected (data minimisation).
        },
      });
      created = true;
    }

    const reg = await tx.playerRegistration.create({
      data: {
        parentGuardianId: existing.id,
        firstName: f.playerFirstName,
        lastName: f.playerLastName,
        dateOfBirth: dob,
        gender,
        nationality: f.nationality || null,
        position,
        preferredFoot,
        previousClub: f.previousClub || null,
        previousAcademy: f.previousAcademy || null,
        emergencyName: f.emergencyName,
        emergencyPhone: f.emergencyPhone,
        emergencyRelationship: f.emergencyRelationship,
        // Sensitive health data, encrypted above.
        medicalNotes: encryptedMedicalNotes,
        status: "PENDING",
        consent: {
          create: {
            dataProcessing: c.dataProcessing,
            statistics: c.statistics,
            emergencyTreatmentAuthorised: c.emergencyTreatmentAuthorised,
            healthData: c.healthData,
            photography: c.photography,
            videoRecording: c.videoRecording,
            publicMedia: c.publicMedia,
            localScouting: c.localScouting,
            localAgents: c.localAgents,
            overseasAcademies: c.overseasAcademies,
            overseasClubs: c.overseasClubs,
            overseasScouts: c.overseasScouts,
            overseasAgents: c.overseasAgents,
            marketingCommunications: c.marketingCommunications,
            guardianDeclaration: c.guardianDeclaration,
            // Legacy columns "scouts" and "agents" are no longer written (they default to false).
            consentVersion: CONSENT_FORM_VERSION,
            policyVersion: PRIVACY_POLICY_VERSION,
            consentedAt: new Date(),
          },
        },
      },
    });

    return { registration: reg, guardian: existing, guardianCreated: created };
  });

  // Public form, so there is no signed-in actor (the request IP is recorded automatically).
  // Contact details, medical notes and the individual consent choices stay in the registration
  // itself and are not copied into the log. Logged before redirect(), which throws.
  await logAudit({
    action: "registration.submit",
    entityType: "PlayerRegistration",
    entityId: registration.id,
    summary: `New registration submitted for ${registration.firstName} ${registration.lastName}`,
    changes: {
      status: "PENDING",
      guardianId: guardian.id,
      newGuardianRecord: guardianCreated,
      consentVersion: CONSENT_FORM_VERSION,
      policyVersion: PRIVACY_POLICY_VERSION,
    },
  });

  redirect(`/register/player/success?id=${registration.id}`);
}
