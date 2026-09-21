export const ASSESSMENT_ATTRIBUTES: Record<"TECHNICAL" | "TACTICAL" | "PHYSICAL" | "MENTAL", string[]> = {
  TECHNICAL: ["Passing", "First Touch", "Dribbling", "Finishing", "Crossing", "Ball Control"],
  TACTICAL: ["Positioning", "Decision-Making", "Scanning", "Defensive Awareness", "Understanding Space"],
  PHYSICAL: ["Speed", "Acceleration", "Agility", "Endurance", "Work Rate"],
  MENTAL: ["Concentration", "Communication", "Discipline", "Coachability", "Confidence"],
};

export const DOMAINS = ["TECHNICAL", "TACTICAL", "PHYSICAL", "MENTAL"] as const;

export const DOMAIN_LABELS: Record<string, string> = {
  TECHNICAL: "Technical",
  TACTICAL: "Tactical",
  PHYSICAL: "Physical",
  MENTAL: "Mental / Behavioral",
};

export const DOMAIN_COLORS: Record<string, string> = {
  TECHNICAL: "var(--floodlight)",
  TACTICAL: "var(--pitch)",
  PHYSICAL: "var(--card-red)",
  MENTAL: "var(--pitch-dark)",
};

export function attributeSlug(attribute: string): string {
  return attribute.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}