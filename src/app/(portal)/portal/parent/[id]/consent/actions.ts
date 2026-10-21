"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { logAudit } from "@/lib/audit";
import { ALL_CONSENT_TYPES, getCurrentConsents } from "@/lib/consentLedger";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";

type Change = { type: ConsentType; from: boolean; to: boolean };

// The portal layout shows the review banner, so it must refresh as well as this page.
function refreshPortal(playerId: string) {
  revalidatePath(`/portal/parent/${playerId}/consent`);
  revalidatePath("/portal", "layout");
}

/**
 * Normal mode: saves a parent's changes for one child.
 * The ledger is append-only: only the choices that actually changed are written,
 * as new rows. Old rows are never edited or deleted.
 */
export async function updateConsents(playerId: string, formData: FormData): Promise<void> {
  // Checks the signed-in parent really owns this child (404 otherwise).
  const { guardian, player } = await requireOwnedChild(playerId);

  const current = await getCurrentConsents(player.id);
  if (current.size === 0) {
    // First-time setup has its own form (confirmConsents). Never guess a baseline here.
    throw new Error("No consent record exists for this player yet.");
  }

  const changes: Change[] = [];
  for (const type of ALL_CONSENT_TYPES) {
    const to = formData.get(`consent_${type}`) === "on";
    const from = current.get(type)?.granted ?? false;
    if (to !== from) changes.push({ type, from, to });
  }

  if (changes.length === 0) {
    redirect(`/portal/parent/${player.id}/consent?saved=1`);
  }

  const withdrawn = changes.filter((c) => c.from && !c.to).map((c) => c.type);

  await prisma.$transaction(async (tx) => {
    await tx.playerConsent.createMany({
      data: changes.map((c) => ({
        playerId: player.id,
        type: c.type,
        granted: c.to,
        givenById: guardian.id,
        givenByRole: "GUARDIAN" as const,
        source: "PARENT_DASHBOARD" as const,
        formVersion: CONSENT_FORM_VERSION,
        policyVersion: PRIVACY_POLICY_VERSION,
      })),
    });

    // A withdrawal can need follow-up: stop further sharing, and decide what happens to
    // data that was already shared or stored. Give the Academy a task to track it.
    // dueAt is left empty: set it from the response time promised in your privacy policy.
    if (withdrawn.length > 0) {
      await tx.dataSubjectRequest.create({
        data: {
          type: "WITHDRAW_CONSENT",
          status: "RECEIVED",
          playerId: player.id,
          requestedById: guardian.id,
          notes: `Withdrawn from the parent dashboard: ${withdrawn.join(", ")}`,
        },
      });
    }
  });

  // Consent types and yes/no values only. No health or contact details are logged.
  await logAudit({
    action: "consent.change",
    entityType: "PlayerConsent",
    entityId: player.id,
    playerId: player.id,
    summary: `Guardian changed ${changes.length} consent choice(s)${withdrawn.length ? `, including ${withdrawn.length} withdrawal(s)` : ""}`,
    changes: { changed: changes },
  });

  refreshPortal(player.id);
  redirect(`/portal/parent/${player.id}/consent?saved=1`);
}

/**
 * First-time setup and reconfirmation. The parent must accept the required items
 * (enforced here as well as in the browser), then EVERY consent type is written as a new
 * ledger row under the current form and privacy policy versions. Writing the full set,
 * not just the changes, is what clears the "please review" banner.
 *
 * The required acknowledgements are not stored as separate rows: this server check
 * refuses to save without them, and the rows written here carry the form version,
 * policy version, who confirmed and when. Emergency treatment authorisation is stored
 * on the player's health profile.
 */
export async function confirmConsents(playerId: string, formData: FormData): Promise<void> {
  const { user, guardian, player } = await requireOwnedChild(playerId);

  const requiredAccepted = ["ack_dataProcessing", "ack_statistics", "ack_emergencyTreatment", "ack_declaration"].every(
    (key) => formData.get(key) === "on"
  );
  if (!requiredAccepted) {
    redirect(`/portal/parent/${player.id}/consent?error=required`);
  }

  const before = await getCurrentConsents(player.id);
  const firstTime = before.size === 0;

  const rows = ALL_CONSENT_TYPES.map((type) => ({
    type,
    granted: formData.get(`consent_${type}`) === "on",
  }));

  const changes: Change[] = rows
    .map((row) => ({ type: row.type, from: before.get(row.type)?.granted ?? false, to: row.granted }))
    .filter((c) => c.from !== c.to);
  const withdrawn = changes.filter((c) => c.from && !c.to).map((c) => c.type);

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.playerConsent.createMany({
      data: rows.map((row) => ({
        playerId: player.id,
        type: row.type,
        granted: row.granted,
        givenById: guardian.id,
        givenByRole: "GUARDIAN" as const,
        source: "PARENT_DASHBOARD" as const,
        formVersion: CONSENT_FORM_VERSION,
        policyVersion: PRIVACY_POLICY_VERSION,
      })),
    });

    await tx.playerHealthProfile.upsert({
      where: { playerId: player.id },
      update: { emergencyTreatmentAuthorised: true, authorisedAt: now, updatedById: user.id },
      create: { playerId: player.id, emergencyTreatmentAuthorised: true, authorisedAt: now, updatedById: user.id },
    });

    if (withdrawn.length > 0) {
      await tx.dataSubjectRequest.create({
        data: {
          type: "WITHDRAW_CONSENT",
          status: "RECEIVED",
          playerId: player.id,
          requestedById: guardian.id,
          notes: `Withdrawn when the guardian reconfirmed consent: ${withdrawn.join(", ")}`,
        },
      });
    }
  });

  await logAudit({
    action: firstTime ? "consent.firstTime" : "consent.reconfirm",
    entityType: "PlayerConsent",
    entityId: player.id,
    playerId: player.id,
    summary: firstTime
      ? "Guardian set up consent choices"
      : `Guardian reconfirmed consent choices${changes.length ? ` (${changes.length} changed)` : ""}`,
    changes: {
      formVersion: CONSENT_FORM_VERSION,
      policyVersion: PRIVACY_POLICY_VERSION,
      emergencyTreatmentAuthorised: true,
      changed: changes,
    },
  });

  refreshPortal(player.id);
  redirect(`/portal/parent/${player.id}/consent?saved=1`);
}