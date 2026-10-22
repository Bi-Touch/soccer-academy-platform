export const CARE_ROLES = [
  "SAFEGUARDING_LEAD",
  "MEDICAL_OFFICER",
] as const;

export type CareRole = (typeof CARE_ROLES)[number];

export const ROLE_LABEL: Record<CareRole, string> = {
  SAFEGUARDING_LEAD: "safeguarding lead",
  MEDICAL_OFFICER: "medical officer",
};

export function isCareRole(value: string): value is CareRole {
  return (CARE_ROLES as readonly string[]).includes(value);
}