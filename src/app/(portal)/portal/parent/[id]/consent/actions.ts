"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { logAudit } from "@/lib/audit";
import { ALL_CONSENT_TYPES, getCurrentConsents } from "@/lib/consentLedger";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";

/**
 * Saves a parent's consent choices for one child.
 * The ledger is append-only: only the choices that actually changed are written,
 * as new rows. Old rows are never edited or deleted.
 */
export async function updateConsents(playerId: string, formData: FormData): Promise<void> {
  // Checks the signed-in parent really owns this child (404 otherwise).
  const { guardian, player } = await requireOwnedChild(playerId);

  const current = await getCurrentConsents(player.id);
  if (current.size === 0) {
    // Nothing recorded yet: do not guess a baseline.
    throw new Error("No consent record exists for this player yet.");
  }

  const changes: { type: ConsentType; from: boolean; to: boolean }[] = [];
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

  revalidatePath(`/portal/parent/${player.id}/consent`);
  redirect(`/portal/parent/${player.id}/consent?saved=1`);
}
