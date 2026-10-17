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

/**
 * Sorts players by their team's age group, youngest first (U13 before U15), with players who have
 * no team at the end. Players in the same age group are listed alphabetically by name.
 *
 * Players need their team loaded (include: { team: true }). Pass getName if the name comes from
 * somewhere other than the player's own name field, for example your playerName helper.
 */
export function sortPlayersByAgeGroup<T extends { name?: string | null; team?: { ageGroup: string } | null }>(
  players: T[],
  getName: (player: T) => string = (p) => p.name ?? ""
): T[] {
  const ageNumber = (p: T) => {
    const match = p.team?.ageGroup.match(/\d+/);
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
  };

  return [...players].sort(
    (a, b) => ageNumber(a) - ageNumber(b) || getName(a).localeCompare(getName(b))
  );
}
