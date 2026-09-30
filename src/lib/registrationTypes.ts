export type RegistrationFormData = {
  guardianFirstName: string;
  guardianLastName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  guardianIdNumber: string;

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
  medicalNotes: string;

  dataProcessing: boolean;
  statistics: boolean;
  photography: boolean;
  videoRecording: boolean;
  publicMedia: boolean;
  localScouting: boolean;
  overseasAcademies: boolean;
  overseasClubs: boolean;
  scouts: boolean;
  agents: boolean;
  guardianDeclaration: boolean;
};

export const EMPTY_REGISTRATION: RegistrationFormData = {
  guardianFirstName: "", guardianLastName: "", guardianRelationship: "", guardianPhone: "",
  guardianEmail: "", guardianAddress: "", guardianIdNumber: "",
  playerFirstName: "", playerLastName: "", playerDateOfBirth: "", gender: "", nationality: "",
  position: "", preferredFoot: "", previousClub: "", previousAcademy: "",
  emergencyName: "", emergencyPhone: "", medicalNotes: "",
  dataProcessing: false, statistics: false, photography: false, videoRecording: false,
  publicMedia: false, localScouting: false, overseasAcademies: false, overseasClubs: false,
  scouts: false, agents: false, guardianDeclaration: false,
};