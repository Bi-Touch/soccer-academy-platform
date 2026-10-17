/**
 * Sorts teams by the number in their age group, lowest first (U9, U10, U13, U15, U17).
 *
 * Doing this in code rather than with a database sort matters: sorting the text 'U9' against 'U13'
 * puts U9 last, because '9' comes after '1' as text. Teams with no number in their age group go to
 * the end, and ties fall back to the age group text and then the team name so the order never jumps.
 */
export function sortTeamsByAge<T extends { ageGroup: string; name: string }>(teams: T[]): T[] {
  const ageNumber = (t: T) => {
    const match = t.ageGroup.match(/\d+/);
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
  };

  return [...teams].sort(
    (a, b) =>
      ageNumber(a) - ageNumber(b) ||
      a.ageGroup.localeCompare(b.ageGroup) ||
      a.name.localeCompare(b.name)
  );
}
