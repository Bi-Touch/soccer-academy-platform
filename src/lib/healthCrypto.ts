import crypto from "crypto";

/**
 * Field-level encryption for health data (AES-256-GCM).
 *
 * - The key lives in the HEALTH_DATA_KEY environment variable, never in the database or in code.
 *   A copy of the database on its own (a backup, a leaked export, Prisma Studio, someone with
 *   database access) shows only scrambled text for the encrypted fields.
 * - Each value gets its own random IV, and is bound to its field name ("context"), so a value
 *   copied into a different field fails to decrypt.
 * - Any tampering makes decryption fail loudly instead of returning wrong data.
 * - Stored format:  enc:v1:<key id>:<iv>:<auth tag>:<ciphertext>   (all base64 except the key id)
 *
 * Generate a key (once) with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * and put it in HEALTH_DATA_KEY in .env and in Vercel. Keep a copy in a password manager that is
 * separate from the database. IF THE KEY IS LOST, THE ENCRYPTED DATA CANNOT BE RECOVERED.
 *
 * Rotating the key: move the old value into HEALTH_DATA_KEY_PREVIOUS, put a new key in
 * HEALTH_DATA_KEY, then run the encrypt script again with --rotate (new writes use the new key,
 * old values stay readable through the previous key until re-encrypted).
 *
 * Server code only: never import this from a client component.
 */

const ALGORITHM = "aes-256-gcm";
const PATTERN = /^enc:v1:[0-9a-f]{8}:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

/** One context string per encrypted field. Never change these once data exists. */
export const HEALTH_CONTEXT = {
  profileAllergies: "PlayerHealthProfile.allergies",
  profileConditions: "PlayerHealthProfile.conditions",
  profileMedications: "PlayerHealthProfile.medications",
  profileNotes: "PlayerHealthProfile.notes",
  profileInsurance: "PlayerHealthProfile.insuranceInfo",
  registrationNotes: "PlayerRegistration.medicalNotes",
  injuryDescription: "InjuryRecord.description",
  injuryTreatment: "InjuryRecord.treatment",
  concernDescription: "SafeguardingConcern.description",
  concernOutcome: "SafeguardingConcern.outcome",
  concernNote: "SafeguardingAction.note",
} as const;

type KeyEntry = { id: string; key: Buffer };

function loadKey(raw: string | undefined, name: string): KeyEntry | null {
  if (!raw || !raw.trim()) return null;
  const key = Buffer.from(raw.trim(), "base64");
  if (key.length !== 32) {
    throw new Error(`${name} must be 32 random bytes, base64-encoded. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`);
  }
  const id = crypto.createHash("sha256").update(key).digest("hex").slice(0, 8);
  return { id, key };
}

function getKeys(): { current: KeyEntry | null; all: KeyEntry[] } {
  const current = loadKey(process.env.HEALTH_DATA_KEY, "HEALTH_DATA_KEY");
  const previous = loadKey(process.env.HEALTH_DATA_KEY_PREVIOUS, "HEALTH_DATA_KEY_PREVIOUS");
  return { current, all: [current, previous].filter((k): k is KeyEntry => k !== null) };
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && PATTERN.test(value);
}

/**
 * Encrypts a value for storage. Empty values become null. If no key is configured this throws:
 * health data is never silently saved as plain text.
 */
export function encryptField(plain: string | null | undefined, context: string): string | null {
  if (plain === null || plain === undefined) return null;
  if (plain.trim() === "") return null;

  const { current } = getKeys();
  if (!current) {
    throw new Error("HEALTH_DATA_KEY is not set, so health data cannot be saved securely.");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, current.key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["enc", "v1", current.id, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/**
 * Decrypts a stored value. Values that were saved before encryption was switched on (plain
 * text) are returned unchanged until the encrypt script has run. Throws if the value was
 * tampered with, belongs to a different field, or the key is missing.
 */
export function decryptField(value: string | null | undefined, context: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (!isEncrypted(value)) return value; // legacy plain text

  const [, , keyId, ivB64, tagB64, ciphertextB64] = value.split(":");
  const { all } = getKeys();
  const entry = all.find((k) => k.id === keyId);
  if (!entry) {
    throw new Error("No key is available to decrypt this value. Check HEALTH_DATA_KEY (and HEALTH_DATA_KEY_PREVIOUS after a rotation).");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, entry.key, Buffer.from(ivB64, "base64"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]).toString("utf8");
}

/**
 * For screens that list many records. Like decryptField, but if one value cannot be decrypted
 * (wrong key, damaged data) it shows a placeholder and logs the problem instead of breaking the
 * whole page.
 */
export function decryptForDisplay(value: string | null | undefined, context: string): string | null {
  try {
    return decryptField(value, context);
  } catch (e) {
    console.error("Health data could not be decrypted:", context, e instanceof Error ? e.message : e);
    return "[could not be decrypted]";
  }
}

/** True when the value was encrypted with an older key and should be re-encrypted. */
export function needsRotation(value: string | null | undefined): boolean {
  if (!isEncrypted(value)) return false;
  const { current } = getKeys();
  return !!current && (value as string).split(":")[2] !== current.id;
}

/* ------------------------------------------------------------------ */
/* PlayerHealthProfile helpers                                         */
/* ------------------------------------------------------------------ */

const PROFILE_CONTEXT = {
  allergies: HEALTH_CONTEXT.profileAllergies,
  conditions: HEALTH_CONTEXT.profileConditions,
  medications: HEALTH_CONTEXT.profileMedications,
  notes: HEALTH_CONTEXT.profileNotes,
  insuranceInfo: HEALTH_CONTEXT.profileInsurance,
} as const;

export type ProfileSecretField = keyof typeof PROFILE_CONTEXT;
export const PROFILE_SECRET_FIELDS = Object.keys(PROFILE_CONTEXT) as ProfileSecretField[];

export function profileContext(field: ProfileSecretField): string {
  return PROFILE_CONTEXT[field];
}

/** Encrypts the sensitive fields of a health profile before it is written to the database. */
export function encryptProfileFields(
  input: Partial<Record<ProfileSecretField, string | null>>
): Partial<Record<ProfileSecretField, string | null>> {
  const out: Partial<Record<ProfileSecretField, string | null>> = {};
  for (const field of PROFILE_SECRET_FIELDS) {
    if (field in input) out[field] = encryptField(input[field], PROFILE_CONTEXT[field]);
  }
  return out;
}

/** Returns a copy of a health profile row with the sensitive fields decrypted. */
export function decryptProfile<T extends Record<ProfileSecretField, string | null>>(profile: T): T {
  const copy = { ...profile };
  for (const field of PROFILE_SECRET_FIELDS) {
    copy[field] = decryptField(profile[field], PROFILE_CONTEXT[field]) as T[ProfileSecretField];
  }
  return copy;
}

/* ------------------------------------------------------------------ */
/* InjuryRecord helpers                                                */
/* ------------------------------------------------------------------ */

// Only the free-text fields are encrypted. injuryType, dates and status stay readable so that
// injury lists, filters, reports and analytics keep working.
const INJURY_CONTEXT = {
  description: HEALTH_CONTEXT.injuryDescription,
  treatment: HEALTH_CONTEXT.injuryTreatment,
} as const;

export type InjurySecretField = keyof typeof INJURY_CONTEXT;
export const INJURY_SECRET_FIELDS = Object.keys(INJURY_CONTEXT) as InjurySecretField[];

export function injuryContext(field: InjurySecretField): string {
  return INJURY_CONTEXT[field];
}

/**
 * Encrypts the free-text fields of an injury record before it is written.
 * Only the fields present in the input are returned, so it is safe to spread into
 * both create and update data.
 */
export function encryptInjuryFields(
  input: Partial<Record<InjurySecretField, string | null | undefined>>
): Partial<Record<InjurySecretField, string | null>> {
  const out: Partial<Record<InjurySecretField, string | null>> = {};
  for (const field of INJURY_SECRET_FIELDS) {
    if (field in input) out[field] = encryptField(input[field], INJURY_CONTEXT[field]);
  }
  return out;
}

/** Returns a copy of an injury record with its free-text fields decrypted. */
export function decryptInjuryRecord<T extends Record<InjurySecretField, string | null>>(record: T): T {
  const copy = { ...record };
  for (const field of INJURY_SECRET_FIELDS) {
    copy[field] = decryptField(record[field], INJURY_CONTEXT[field]) as T[InjurySecretField];
  }
  return copy;
}
