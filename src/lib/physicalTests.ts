export type PhysicalTestMetric = {
  key: string;
  testCode: string;
  label: string;
  unit: string;
  lowerIsBetter: boolean;
};

export const PHYSICAL_TEST_METRICS: PhysicalTestMetric[] = [
  { key: "sprint_10m", testCode: "10M_SPRINT", label: "10m Sprint", unit: "sec", lowerIsBetter: true },
  { key: "sprint_30m", testCode: "30M_SPRINT", label: "30m Sprint", unit: "sec", lowerIsBetter: true },
  { key: "agility_505", testCode: "505_COD", label: "Change of Direction (505)", unit: "sec", lowerIsBetter: true },
  { key: "endurance_yoyo", testCode: "YOYO_IR1", label: "Yo-Yo IR1", unit: "m", lowerIsBetter: false },
  { key: "vertical_jump", testCode: "CMJ", label: "Countermovement Jump (CMJ)", unit: "cm", lowerIsBetter: false },
  { key: "repeated_sprint", testCode: "RSA_6X20", label: "Repeated Sprint Ability (avg, 6x20m)", unit: "sec", lowerIsBetter: true },
];