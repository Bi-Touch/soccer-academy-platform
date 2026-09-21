export type PhysicalTestMetric = {
  key: string;
  label: string;
  unit: string;
  lowerIsBetter: boolean;
};

export const PHYSICAL_TEST_METRICS: PhysicalTestMetric[] = [
  { key: "sprint_10m", label: "10m Sprint", unit: "sec", lowerIsBetter: true },
  { key: "sprint_30m", label: "30m Sprint", unit: "sec", lowerIsBetter: true },
  { key: "agility_505", label: "Agility (505 test)", unit: "sec", lowerIsBetter: true },
  { key: "endurance_yoyo", label: "Endurance (Yo-Yo level)", unit: "level", lowerIsBetter: false },
  { key: "vertical_jump", label: "Vertical Jump", unit: "cm", lowerIsBetter: false },
  { key: "repeated_sprint", label: "Repeated Sprint Ability (avg)", unit: "sec", lowerIsBetter: true },
];