import type { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALL_CONSENT_TYPES } from "@/lib/consentLedger";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";

export type ConsentReviewStatus = {
  playerId: string;
  /** True when the parent should confirm their choices again. */
  needsReview: boolean;
  /** True when nothing at all has been recorded for this player yet. */
  firstTime: boolean;
  /** Plain-language reasons, shown to the parent. */
  reasons: string[];
};

/**
 * Decides, for each player, whether the parent needs to (re)confirm consent:
 *  - nothing has been recorded yet (first-time setup), or
 *  - the latest decisions were made under an older consent form or privacy policy
 *    (or a consent type was added since), or
 *  - emergency treatment authorisation has not been confirmed.
 *
 * Bumping CONSENT_FORM_VERSION or PRIVACY_POLICY_VERSION in lib/privacyVersions.ts
 * therefore asks every family to review again.
 *
 * One query per table for all players, so it is cheap to call from a layout.
 */
export async function getConsentReviewStatuses(
  playerIds: string[]
): Promise<Map<string, ConsentReviewStatus>> {
  const result = new Map<string, ConsentReviewStatus>();
  if (playerIds.length === 0) return result;

  const [rows, profiles] = await Promise.all([
    prisma.playerConsent.findMany({
      where: { playerId: { in: playerIds } },
      orderBy: { createdAt: "desc" },
      select: { playerId: true, type: true, formVersion: true, policyVersion: true },
    }),
    prisma.playerHealthProfile.findMany({
      where: { playerId: { in: playerIds } },
      select: { playerId: true, emergencyTreatmentAuthorised: true },
    }),
  ]);

  // Newest decision per player and consent type.
  const latest = new Map<string, Map<ConsentType, { formVersion: string; policyVersion: string }>>();
  for (const row of rows) {
    let perPlayer = latest.get(row.playerId);
    if (!perPlayer) {
      perPlayer = new Map();
      latest.set(row.playerId, perPlayer);
    }
    if (!perPlayer.has(row.type)) {
      perPlayer.set(row.type, { formVersion: row.formVersion, policyVersion: row.policyVersion });
    }
  }

  const emergency = new Map<string, boolean>();
  for (const profile of profiles) {
    emergency.set(profile.playerId, profile.emergencyTreatmentAuthorised);
  }

  for (const playerId of playerIds) {
    const perPlayer = latest.get(playerId);
    const firstTime = !perPlayer || perPlayer.size === 0;
    const reasons: string[] = [];

    if (firstTime) {
      reasons.push("Your consent choices have not been recorded yet.");
    } else {
      const outdated = ALL_CONSENT_TYPES.some((type) => {
        const entry = perPlayer.get(type);
        return (
          !entry ||
          entry.formVersion !== CONSENT_FORM_VERSION ||
          entry.policyVersion !== PRIVACY_POLICY_VERSION
        );
      });
      if (outdated) {
        reasons.push("The consent form or privacy policy has been updated since you last confirmed your choices.");
      }
    }

    if (!emergency.get(playerId)) {
      reasons.push("Emergency treatment authorisation has not been confirmed.");
    }

    result.set(playerId, { playerId, needsReview: reasons.length > 0, firstTime, reasons });
  }

  return result;
}
