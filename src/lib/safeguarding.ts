import type { ClearanceType, ConcernCategory, ConcernStatus } from "@prisma/client";

export const CATEGORY_LABELS: Record<ConcernCategory, string> = {
  PHYSICAL: "Physical harm",
  EMOTIONAL: "Emotional harm",
  SEXUAL: "Sexual harm or inappropriate behaviour",
  NEGLECT: "Neglect",
  ONLINE: "Online or social media",
  BULLYING: "Bullying",
  CONDUCT_BY_STAFF: "Concern about a staff member or volunteer",
  OTHER: "Something else",
};

export const STATUS_LABELS: Record<ConcernStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  REFERRED_EXTERNAL: "Referred to an outside agency",
  CLOSED: "Closed",
};

export const CLEARANCE_LABELS: Record<ClearanceType, string> = {
  CERTIFICATE_OF_GOOD_CONDUCT: "Certificate of good conduct",
  SAFEGUARDING_TRAINING: "Safeguarding training",
  CODE_OF_CONDUCT_SIGNED: "Code of conduct signed",
  FIRST_AID: "First aid",
  COACHING_LICENCE: "Coaching licence",
};

/** Everyone who works with players must hold these. The others are recorded but not required. */
export const REQUIRED_CLEARANCES: ClearanceType[] = [
  "CERTIFICATE_OF_GOOD_CONDUCT",
  "SAFEGUARDING_TRAINING",
  "CODE_OF_CONDUCT_SIGNED",
];
export const ALL_CLEARANCES: ClearanceType[] = [...REQUIRED_CLEARANCES, "FIRST_AID", "COACHING_LICENCE"];

/** Why the lead is opening a concern. The code is logged with every view. */
export const VIEW_REASONS = {
  new: "Reviewing a newly raised concern",
  follow_up: "Following up on an open concern",
  referral: "Preparing or tracking a referral",
  oversight: "Periodic review or oversight",
  request: "Responding to a formal request",
} as const;
export type ViewReasonCode = keyof typeof VIEW_REASONS;

export function isViewReason(value: string | undefined): value is ViewReasonCode {
  return !!value && Object.prototype.hasOwnProperty.call(VIEW_REASONS, value);
}
export function isCategory(value: string): value is ConcernCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value);
}
export function isStatus(value: string): value is ConcernStatus {
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, value);
}
export function isClearanceType(value: string): value is ClearanceType {
  return Object.prototype.hasOwnProperty.call(CLEARANCE_LABELS, value);
}

/** A short reference people can quote without revealing anything about the concern. */
export function concernRef(id: string): string {
  return `SG-${id.slice(-6).toUpperCase()}`;
}

/** An open concern older than this is flagged on the list. */
export const STALE_DAYS = 7;

export function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export type ClearanceState = "valid" | "expiring" | "expired" | "missing";

/** State of the newest record of one clearance type. "expiring" means within 60 days. */
export function clearanceState(latest: { expiresAt: Date | null } | undefined, now: Date = new Date()): ClearanceState {
  if (!latest) return "missing";
  if (!latest.expiresAt) return "valid";
  if (latest.expiresAt.getTime() < now.getTime()) return "expired";
  if (latest.expiresAt.getTime() - now.getTime() < 60 * 86400000) return "expiring";
  return "valid";
}

/** Safe to show to the child's guardians: no medical or safeguarding detail. */
export const EMERGENCY_NOTICE =
  "If a child is in immediate danger, call 999 or 112 now. Childline Kenya (116, free, 24 hours) can also help.";
