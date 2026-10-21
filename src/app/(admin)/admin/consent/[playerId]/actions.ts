"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { ageInYears } from "@/lib/registrationTypes";
import { ALL_CONSENT_TYPES, getCurrentConsents } from "@/lib/consentLedger";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";

/**
 * Records a signed paper consent form on behalf of a family.
 *
 * - Only an administrator can do this, and every row records who entered it
 *   (recordedById) with source ADMIN_ON_BEHALF.
 * - The full set of consent types is written as new ledger rows (the ledger is append-only),
 *   dated with the date the family signed.
 * - Only forms printed from the CURRENT form version can be recorded, so an old form is never
 *   entered under newer wording.
 * - A minor's consent is recorded as the guardian's. A player aged 18 or over consents for
 *   themselves.
 */
export async function recordPaperConsent(playerId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const back = `/admin/consent/${playerId}`;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, dateOfBirth: true, parentGuardianId: true },
  });
  if (!player) notFound();

  // Who signed: the player if they are an adult, otherwise their guardian.
  const age = player.dateOfBirth ? ageInYears(player.dateOfBirth.toISOString().slice(0, 10)) : null;
  const adult = age !== null && age >= 18;

  let signerId: string;
  let signerRole: "GUARDIAN" | "PLAYER";
  if (adult) {
    signerId = player.id;
    signerRole = "PLAYER";
  } else if (player.parentGuardianId) {
    signerId = player.parentGuardianId;
    signerRole = "GUARDIAN";
  } else {
    // A minor with no linked guardian: there is nobody who can give consent.
    redirect(`${back}?error=signer`);
  }

  const requiredAccepted = [
    "ack_dataProcessing",
    "ack_statistics",
    "ack_emergencyTreatment",
    "ack_declaration",
    "seen_form",
  ].every((key) => formData.get(key) === "on");
  if (!requiredAccepted) redirect(`${back}?error=required`);

  const formVersion = String(formData.get("formVersion") ?? "").trim();
  if (formVersion !== CONSENT_FORM_VERSION) redirect(`${back}?error=version`);

  // The date the family signed. Must be a real date, and not in the future.
  const signedOn = String(formData.get("signedOn") ?? "");
  const daysCheck = ageInYears(signedOn);
  if (daysCheck === null || daysCheck < 0) redirect(`${back}?error=date`);
  const noon = new Date(`${signedOn}T12:00:00.000Z`);
  const now = new Date();
  const signedAt = noon > now ? now : noon;

  const reference = String(formData.get("paperReference") ?? "").trim().slice(0, 100);

  const before = await getCurrentConsents(player.id);
  const firstTime = before.size === 0;

  const rows = ALL_CONSENT_TYPES.map((type) => ({
    type,
    granted: formData.get(`consent_${type}`) === "on",
  }));

  const changes: { type: ConsentType; from: boolean; to: boolean }[] = rows
    .map((row) => ({ type: row.type, from: before.get(row.type)?.granted ?? false, to: row.granted }))
    .filter((c) => c.from !== c.to);
  const withdrawn = changes.filter((c) => c.from && !c.to).map((c) => c.type);

  await prisma.$transaction(async (tx) => {
    await tx.playerConsent.createMany({
      data: rows.map((row) => ({
        playerId: player.id,
        type: row.type,
        granted: row.granted,
        givenById: signerId,
        givenByRole: signerRole,
        source: "ADMIN_ON_BEHALF" as const,
        formVersion: CONSENT_FORM_VERSION,
        policyVersion: PRIVACY_POLICY_VERSION,
        recordedById: admin.id,
        createdAt: signedAt,
      })),
    });

    // The emergency treatment authorisation on the paper form.
    await tx.playerHealthProfile.upsert({
      where: { playerId: player.id },
      update: { emergencyTreatmentAuthorised: true, authorisedAt: signedAt, updatedById: admin.id },
      create: { playerId: player.id, emergencyTreatmentAuthorised: true, authorisedAt: signedAt, updatedById: admin.id },
    });

    if (withdrawn.length > 0) {
      await tx.dataSubjectRequest.create({
        data: {
          type: "WITHDRAW_CONSENT",
          status: "RECEIVED",
          playerId: player.id,
          requestedById: signerId,
          notes: `Withdrawn on a paper form recorded by staff: ${withdrawn.join(", ")}`,
        },
      });
    }
  });

  // Metadata only: consent types and yes/no values, the form version, and where the paper
  // form is filed. The reason field is where the paper evidence is referenced.
  await logAudit({
    action: "consent.paper",
    entityType: "PlayerConsent",
    entityId: player.id,
    playerId: player.id,
    reason: `Paper form signed ${signedOn}${reference ? `, filed as: ${reference}` : ""}`,
    summary: firstTime
      ? "Staff recorded a signed paper consent form (first-time setup)"
      : `Staff recorded a signed paper consent form${changes.length ? ` (${changes.length} changed)` : ""}`,
    changes: {
      formVersion: CONSENT_FORM_VERSION,
      policyVersion: PRIVACY_POLICY_VERSION,
      signedBy: signerRole,
      emergencyTreatmentAuthorised: true,
      changed: changes,
    },
  });

  revalidatePath("/admin/consent");
  revalidatePath(back);
  revalidatePath("/portal", "layout");
  redirect(`${back}?saved=1`);
}
