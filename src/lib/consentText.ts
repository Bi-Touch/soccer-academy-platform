/**
 * The required statements, word for word, as shown to parents.
 * The paper form and the admin "record paper consent" screen use these exact words so the
 * evidence always matches what the family was shown.
 *
 * If you change any wording here (or the optional items in CONSENT_GROUPS), bump
 * CONSENT_FORM_VERSION in lib/privacyVersions.ts so families are asked again and old
 * paper forms can no longer be recorded under the new version.
 *
 * The parent portal and registration pages still hold their own copy of these sentences;
 * keep them identical.
 */
export const REQUIRED_STATEMENTS = {
  dataProcessing:
    "I understand that the Academy will collect and use the player's personal information to run registration, training and matches, to keep players safe (including safeguarding) and to support their development, as explained in the Privacy Policy.",
  statistics:
    "I understand that training and match statistics will be recorded and used for coaching and player development.",
  emergencyTreatment:
    "If I cannot be reached in an emergency, I authorise Academy staff to arrange urgent medical treatment for the player.",
  declaration:
    "I confirm that I am the player's parent or legal guardian with authority to give these consents, and I have read and understood the Privacy Policy.",
} as const;
