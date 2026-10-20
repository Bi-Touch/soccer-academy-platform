import type { ConsentRecord, ConsentType } from "@prisma/client";

type ConsentFields = Pick<
  ConsentRecord,
  | "photography"
  | "videoRecording"
  | "publicMedia"
  | "localScouting"
  | "localAgents"
  | "scouts"
  | "agents"
  | "overseasAcademies"
  | "overseasClubs"
  | "overseasScouts"
  | "overseasAgents"
  | "healthData"
  | "marketingCommunications"
>;

/**
 * Turns the registration snapshot into one ledger decision per consent type.
 * Explicit "no" rows are kept on purpose: they show the choice was offered and declined.
 * Registrations made before the local/overseas split have only the legacy scouts and
 * agents ticks, and those count as LOCAL ONLY.
 */
export function consentRowsFromRecord(consent: ConsentFields): { type: ConsentType; granted: boolean }[] {
  return [
    { type: "PHOTOGRAPHY", granted: consent.photography },
    { type: "VIDEO", granted: consent.videoRecording },
    { type: "PUBLIC_MEDIA", granted: consent.publicMedia },
    { type: "SCOUTING_LOCAL", granted: consent.localScouting || consent.scouts },
    { type: "AGENTS_LOCAL", granted: consent.localAgents || consent.agents },
    { type: "SCOUTING_OVERSEAS_ACADEMIES", granted: consent.overseasAcademies },
    { type: "SCOUTING_OVERSEAS_CLUBS", granted: consent.overseasClubs },
    { type: "SCOUTING_OVERSEAS_SCOUTS", granted: consent.overseasScouts },
    { type: "SCOUTING_OVERSEAS_AGENTS", granted: consent.overseasAgents },
    { type: "HEALTH_DATA", granted: consent.healthData },
    { type: "MARKETING_COMMUNICATIONS", granted: consent.marketingCommunications },
  ];
}
