"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireHealthWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  PROFILE_SECRET_FIELDS,
  decryptField,
  encryptField,
  encryptProfileFields,
  HEALTH_CONTEXT,
  profileContext,
  type ProfileSecretField,
} from "@/lib/healthCrypto";

const MAX: Record<ProfileSecretField, number> = {
  allergies: 2000,
  conditions: 2000,
  medications: 2000,
  notes: 2000,
  insuranceInfo: 500,
};

function read(formData: FormData, key: string, max: number): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

/**
 * Saves a player's health information. Admins and medical officers only. The sensitive fields
 * are encrypted before they reach the database. The audit entry records WHICH fields changed,
 * never what they contain.
 */
export async function updateHealthProfile(playerId: string, formData: FormData): Promise<void> {
  const staff = await requireHealthWrite();

  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!player) notFound();

  const existing = await prisma.playerHealthProfile.findUnique({ where: { playerId } });

  const secret: Partial<Record<ProfileSecretField, string | null>> = {};
  for (const field of PROFILE_SECRET_FIELDS) secret[field] = read(formData, field, MAX[field]);
  const doctorName = read(formData, "doctorName", 100);
  const doctorPhone = read(formData, "doctorPhone", 30);

  // Work out which fields actually changed, by comparing with the decrypted current values.
  const changed: string[] = [];
  for (const field of PROFILE_SECRET_FIELDS) {
    const before = existing ? decryptField(existing[field], profileContext(field)) : null;
    if ((before ?? null) !== (secret[field] ?? null)) changed.push(field);
  }
  if ((existing?.doctorName ?? null) !== doctorName) changed.push("doctorName");
  if ((existing?.doctorPhone ?? null) !== doctorPhone) changed.push("doctorPhone");

  const encrypted = encryptProfileFields(secret);

  await prisma.playerHealthProfile.upsert({
    where: { playerId },
    update: { ...encrypted, doctorName, doctorPhone, updatedById: staff.id },
    create: { playerId, ...encrypted, doctorName, doctorPhone, updatedById: staff.id },
  });

  await logAudit({
    action: "health.update",
    entityType: "PlayerHealthProfile",
    entityId: existing?.id,
    playerId,
    summary: changed.length ? `Updated health information (${changed.length} field(s))` : "Saved health information (no changes)",
    changes: { fields: changed },
  });

  revalidatePath(`/admin/health/${playerId}`);
  revalidatePath(`/portal/parent/${playerId}/health`);
  redirect(`/admin/health/${playerId}?saved=1`);
}

function validDate(value: string): Date | null {
  const date = new Date(`${value}T12:00:00.000Z`);
  return value && !Number.isNaN(date.getTime()) ? date : null;
}

/**
 * Records an injury. Admins and medical officers. The description and treatment are encrypted;
 * the audit entry records the type and dates only.
 */
export async function addInjury(playerId: string, formData: FormData): Promise<void> {
  const staff = await requireHealthWrite();
  const back = `/admin/health/${playerId}`;

  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } });
  if (!player) notFound();

  const injuryType = read(formData, "injuryType", 100);
  const occurred = validDate(String(formData.get("dateOccurred") ?? ""));
  if (!injuryType || !occurred) redirect(`${back}?error=injury`);

  const expectedRaw = String(formData.get("expectedReturnDate") ?? "");
  const expected = expectedRaw ? validDate(expectedRaw) : null;
  if (expectedRaw && !expected) redirect(`${back}?error=injury`);

  let description: string | null;
  let treatment: string | null;
  try {
    description = encryptField(read(formData, "description", 2000), HEALTH_CONTEXT.injuryDescription);
    treatment = encryptField(read(formData, "treatment", 2000), HEALTH_CONTEXT.injuryTreatment);
  } catch (e) {
    console.error("Could not encrypt injury details:", e);
    redirect(`${back}?error=secure`);
  }

  const created = await prisma.injuryRecord.create({
    data: {
      playerId,
      injuryType,
      description,
      treatment,
      dateOccurred: occurred,
      expectedReturnDate: expected,
      recordedBy: staff.id,
      status: "ACTIVE",
    },
  });

  await logAudit({
    action: "injury.create",
    entityType: "InjuryRecord",
    entityId: created.id,
    playerId,
    summary: "Recorded an injury",
    changes: { injuryType, dateOccurred: occurred.toISOString().slice(0, 10), status: "ACTIVE" },
  });

  revalidatePath(back);
  revalidatePath("/admin/health");
  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${playerId}/reports`);
  redirect(`${back}?saved=1`);
}

/** Marks an injury as recovered. Admins and medical officers. */
export async function markInjuryRecovered(injuryId: string): Promise<void> {
  await requireHealthWrite();

  const before = await prisma.injuryRecord.findUnique({ where: { id: injuryId } });
  if (!before) notFound();

  const injury = await prisma.injuryRecord.update({
    where: { id: injuryId },
    data: { status: "RECOVERED", actualReturnDate: new Date() },
  });

  await logAudit({
    action: "injury.recovered",
    entityType: "InjuryRecord",
    entityId: injuryId,
    playerId: injury.playerId,
    summary: "Marked an injury as recovered",
    changes: { status: { from: before.status, to: injury.status } },
  });

  revalidatePath(`/admin/health/${injury.playerId}`);
  revalidatePath("/admin/health");
  revalidatePath("/admin/injuries");
  revalidatePath(`/admin/players/${injury.playerId}/reports`);
}
