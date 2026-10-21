"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireHealthWrite } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  PROFILE_SECRET_FIELDS,
  decryptField,
  encryptProfileFields,
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
