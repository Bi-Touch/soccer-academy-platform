const BRACKETS = [9, 11, 13, 15, 17, 19];

export function computeAgeGroup(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return "Unknown";

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  const bracket = BRACKETS.find((b) => age <= b);
  return bracket ? `U${bracket}` : "Senior";
}