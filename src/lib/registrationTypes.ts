export const GUARDIAN_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Legal guardian",
  "Grandparent",
  "Other relative",
] as const;

export type RegistrationFormData = {
  guardianFirstName: string;
  guardianLastName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;

  playerFirstName: string;
  playerLastName: string;
  playerDateOfBirth: string;
  gender: string;
  nationality: string;
  position: string;
  preferredFoot: string;
  previousClub: string;
  previousAcademy: string;

  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  medicalNotes: string;

  // Required acknowledgements / authorisation
  dataProcessing: boolean;
  statistics: boolean;
  emergencyTreatmentAuthorised: boolean;

  // Optional consents
  healthData: boolean; // required only when medical notes are entered
  photography: boolean;
  videoRecording: boolean;
  publicMedia: boolean;
  localScouting: boolean; // local academies, clubs and scouts
  localAgents: boolean;
  overseasAcademies: boolean;
  overseasClubs: boolean;
  overseasScouts: boolean;
  overseasAgents: boolean;
  marketingCommunications: boolean;

  guardianDeclaration: boolean;
};

export const EMPTY_REGISTRATION: RegistrationFormData = {
  guardianFirstName: "",
  guardianLastName: "",
  guardianRelationship: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianAddress: "",

  playerFirstName: "",
  playerLastName: "",
  playerDateOfBirth: "",
  gender: "",
  nationality: "",
  position: "",
  preferredFoot: "",
  previousClub: "",
  previousAcademy: "",

  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  medicalNotes: "",

  dataProcessing: false,
  statistics: false,
  emergencyTreatmentAuthorised: false,

  healthData: false,
  photography: false,
  videoRecording: false,
  publicMedia: false,
  localScouting: false,
  localAgents: false,
  overseasAcademies: false,
  overseasClubs: false,
  overseasScouts: false,
  overseasAgents: false,
  marketingCommunications: false,

  guardianDeclaration: false,
};

/**
 * Age in whole years from a "YYYY-MM-DD" date string, or null if the string is
 * not a real date. Negative means the date is in the future.
 * Used by the form and by the server action so both apply the same rule.
 */
export function ageInYears(dob: string, today: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  let age = today.getFullYear() - year;
  const todayMonth = today.getMonth() + 1;
  if (todayMonth < month || (todayMonth === month && today.getDate() < day)) {
    age -= 1;
  }
  return age;
}