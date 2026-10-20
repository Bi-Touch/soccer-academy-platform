import type { ConsentSource, ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConsentItem = { type: ConsentType; label: string; description?: string };
export type ConsentGroup = { title: string; intro?: string; items: ConsentItem[] };

/** What parents see and can change. Keep the wording in step with the registration form. */
export const CONSENT_GROUPS: ConsentGroup[] = [
  {
    title: "Health information",
    items: [
      {
        type: "HEALTH_DATA",
        label: "The Academy may record my child's health information and share it with coaches and medical staff only as needed to keep them safe",
      },
    ],
  },
  {
    title: "Photos and video",
    items: [
      { type: "PHOTOGRAPHY", label: "Photography during Academy activities" },
      { type: "VIDEO", label: "Training and match video recording" },
      {
        type: "PUBLIC_MEDIA",
        label: "Public use of photos and videos on the Academy website and social media",
        description: "Only applies to photos and videos you allow above.",
      },
    ],
  },
  {
    title: "Football development and scouting: Kenya",
    items: [
      { type: "SCOUTING_LOCAL", label: "Share information with local (Kenyan) academies, clubs and scouts" },
      { type: "AGENTS_LOCAL", label: "Share information with local (Kenyan) football agents or intermediaries" },
    ],
  },
  {
    title: "Football development and scouting: overseas",
    intro: "Overseas sharing means information may be sent outside Kenya, where data protection rules may differ.",
    items: [
      { type: "SCOUTING_OVERSEAS_ACADEMIES", label: "Share information with overseas academies" },
      { type: "SCOUTING_OVERSEAS_CLUBS", label: "Share information with overseas clubs" },
      { type: "SCOUTING_OVERSEAS_SCOUTS", label: "Share information with overseas scouts and talent identification organisations" },
      { type: "SCOUTING_OVERSEAS_AGENTS", label: "Share information with overseas football agents or intermediaries" },
    ],
  },
  {
    title: "Communications",
    items: [{ type: "MARKETING_COMMUNICATIONS", label: "Academy news and promotional updates" }],
  },
];

export const ALL_CONSENT_TYPES: ConsentType[] = CONSENT_GROUPS.flatMap((g) => g.items.map((i) => i.type));

export type CurrentConsent = { granted: boolean; changedAt: Date; source: ConsentSource };

/**
 * Current state per consent type = the newest ledger row for that type.
 * A type with no row at all counts as NOT granted.
 */
export async function getCurrentConsents(playerId: string): Promise<Map<ConsentType, CurrentConsent>> {
  const rows = await prisma.playerConsent.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    select: { type: true, granted: true, createdAt: true, source: true },
  });

  const current = new Map<ConsentType, CurrentConsent>();
  for (const row of rows) {
    if (!current.has(row.type)) {
      current.set(row.type, { granted: row.granted, changedAt: row.createdAt, source: row.source });
    }
  }
  return current;
}

/**
 * IDs of players who currently grant EVERY one of the given consent types.
 *
 * Use this to filter anything shown publicly or shared outside the Academy:
 *   const ok = await getConsentedPlayerIds(["PUBLIC_MEDIA", "PHOTOGRAPHY"]);
 *   const showable = photos.filter(p => p.players.every(pl => ok.has(pl.id)));
 * Withdrawing a consent takes effect the next time this runs, so do not cache it for long.
 */
export async function getConsentedPlayerIds(types: ConsentType[]): Promise<Set<string>> {
  const rows = await prisma.playerConsent.findMany({
    where: { type: { in: types } },
    orderBy: { createdAt: "desc" },
    select: { playerId: true, type: true, granted: true },
  });

  const latest = new Map<string, boolean>(); // "playerId|type" -> newest decision
  for (const row of rows) {
    const key = `${row.playerId}|${row.type}`;
    if (!latest.has(key)) latest.set(key, row.granted);
  }

  const grantedCount = new Map<string, number>();
  for (const [key, granted] of latest) {
    if (!granted) continue;
    const playerId = key.split("|")[0];
    grantedCount.set(playerId, (grantedCount.get(playerId) ?? 0) + 1);
  }

  const result = new Set<string>();
  for (const [playerId, count] of grantedCount) {
    if (count === types.length) result.add(playerId);
  }
  return result;
}
