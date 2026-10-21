/**
 * One-off backfill for players approved BEFORE the new approval code existed.
 * Those players have no PlayerConsent rows, no health profile and no emergency
 * contact, so the new consent page would show every choice as "not granted".
 *
 * Dry run (changes nothing):  npx tsx scripts/backfill-player-consents.ts
 * Apply:                      npx tsx scripts/backfill-player-consents.ts --apply
 *
 * Players that already have rows are skipped, so it is safe to run twice.
 */
import { PrismaClient } from "@prisma/client";
import { consentRowsFromRecord } from "../src/lib/consentMapping";
import { HEALTH_CONTEXT, decryptField, encryptField } from "../src/lib/healthCrypto";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const registrations = await prisma.playerRegistration.findMany({
    where: { status: "APPROVED", createdPlayerId: { not: null }, consent: { isNot: null } },
    include: { consent: true },
  });

  let consentsSeeded = 0;
  let contactsCreated = 0;
  let profilesCreated = 0;
  let notesNeedFollowUp = 0;

  for (const reg of registrations) {
    const playerId = reg.createdPlayerId as string;
    const consent = reg.consent;
    if (!consent) continue;

    const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
    if (!player) continue;

    // Consent ledger
    if ((await prisma.playerConsent.count({ where: { playerId } })) === 0) {
      const rows = consentRowsFromRecord(consent);
      consentsSeeded += rows.length;
      if (apply) {
        await prisma.playerConsent.createMany({
          data: rows.map((row) => ({
            playerId,
            type: row.type,
            granted: row.granted,
            givenById: reg.parentGuardianId,
            givenByRole: "GUARDIAN" as const,
            source: "REGISTRATION" as const,
            formVersion: consent.consentVersion,
            policyVersion: consent.policyVersion ?? "legacy",
            consentRecordId: consent.id,
            createdAt: consent.consentedAt,
          })),
        });
      }
    }

    // Emergency contact
    if (
      reg.emergencyName &&
      reg.emergencyPhone &&
      (await prisma.emergencyContact.count({ where: { playerId } })) === 0
    ) {
      contactsCreated += 1;
      if (apply) {
        await prisma.emergencyContact.create({
          data: {
            playerId,
            name: reg.emergencyName,
            relationship: reg.emergencyRelationship || "Not stated",
            phone: reg.emergencyPhone,
            isPrimary: true,
          },
        });
      }
    }

    // Health profile. Medical notes move only if health-data consent was given;
    // otherwise they stay on the registration for an administrator to follow up.
    const hasProfile = await prisma.playerHealthProfile.findUnique({ where: { playerId }, select: { id: true } });
    if (!hasProfile) {
      const notes = decryptField(reg.medicalNotes, HEALTH_CONTEXT.registrationNotes)?.trim() || null;
      const importNotes = Boolean(notes) && consent.healthData;
      if (notes && !importNotes) notesNeedFollowUp += 1;
      profilesCreated += 1;

      if (apply) {
        await prisma.playerHealthProfile.create({
          data: {
            playerId,
            notes: importNotes ? encryptField(notes, HEALTH_CONTEXT.profileNotes) : null,
            emergencyTreatmentAuthorised: consent.emergencyTreatmentAuthorised,
            authorisedAt: consent.emergencyTreatmentAuthorised ? consent.consentedAt : null,
          },
        });
        if (importNotes) {
          await prisma.playerRegistration.update({ where: { id: reg.id }, data: { medicalNotes: null } });
        }
      }
    }
  }

  console.log(apply ? "APPLIED" : "DRY RUN (nothing written, add --apply to write)");
  console.log(`Approved registrations checked: ${registrations.length}`);
  console.log(`Consent rows to seed:           ${consentsSeeded}`);
  console.log(`Emergency contacts to create:   ${contactsCreated}`);
  console.log(`Health profiles to create:      ${profilesCreated}`);
  console.log(`Registrations with medical notes left for follow-up (no health consent): ${notesNeedFollowUp}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
