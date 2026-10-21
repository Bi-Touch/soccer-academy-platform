/**
 * One-off: encrypts health data that was saved as plain text before encryption existed,
 * and (with --rotate) re-encrypts values still using an old key after a key rotation.
 *
 * Needs HEALTH_DATA_KEY in your environment / .env first.
 *
 * Preview (changes nothing):  npx tsx scripts/encrypt-existing-health-data.ts
 * Apply:                      npx tsx scripts/encrypt-existing-health-data.ts --apply
 * After a key rotation:       npx tsx scripts/encrypt-existing-health-data.ts --apply --rotate
 *
 * Safe to run twice: values that are already encrypted are skipped. Each value is decrypted again
 * and compared before it is written, and nothing is ever printed except counts.
 */
import { PrismaClient } from "@prisma/client";
import {
  HEALTH_CONTEXT,
  PROFILE_SECRET_FIELDS,
  decryptField,
  encryptField,
  isEncrypted,
  needsRotation,
  profileContext,
} from "../src/lib/healthCrypto";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const rotate = process.argv.includes("--rotate");

/** Returns the new stored value, or undefined when nothing needs to change. */
function convert(value: string | null, context: string): string | undefined {
  if (!value) return undefined;

  const plain = decryptField(value, context); // plain text passes through; encrypted is decrypted
  const needsEncrypting = !isEncrypted(value);
  const needsRotating = rotate && needsRotation(value);
  if (!needsEncrypting && !needsRotating) return undefined;

  const encrypted = encryptField(plain, context);
  if (!encrypted || decryptField(encrypted, context) !== plain) {
    throw new Error("Round-trip check failed, nothing was written.");
  }
  return encrypted;
}

async function main() {
  // Fail fast if the key is missing or malformed.
  encryptField("key check", "probe");

  let profileValues = 0;
  let registrationValues = 0;

  const profiles = await prisma.playerHealthProfile.findMany();
  for (const profile of profiles) {
    const data: Record<string, string> = {};
    for (const field of PROFILE_SECRET_FIELDS) {
      const next = convert(profile[field], profileContext(field));
      if (next !== undefined) data[field] = next;
    }
    const count = Object.keys(data).length;
    if (count > 0) {
      profileValues += count;
      if (apply) await prisma.playerHealthProfile.update({ where: { id: profile.id }, data });
    }
  }

  const registrations = await prisma.playerRegistration.findMany({
    where: { medicalNotes: { not: null } },
    select: { id: true, medicalNotes: true },
  });
  for (const reg of registrations) {
    const next = convert(reg.medicalNotes, HEALTH_CONTEXT.registrationNotes);
    if (next !== undefined) {
      registrationValues += 1;
      if (apply) await prisma.playerRegistration.update({ where: { id: reg.id }, data: { medicalNotes: next } });
    }
  }

  console.log(apply ? "APPLIED" : "DRY RUN (nothing written, add --apply to write)");
  console.log(`Health profiles checked:            ${profiles.length}`);
  console.log(`Profile values to (re)encrypt:      ${profileValues}`);
  console.log(`Registrations checked (with notes): ${registrations.length}`);
  console.log(`Registration notes to (re)encrypt:  ${registrationValues}`);
  console.log("Injury records are not covered by this script yet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
