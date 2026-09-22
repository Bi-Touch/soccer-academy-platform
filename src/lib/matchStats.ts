export type MatchStatField = { key: string; label: string };
export type MatchStatGroup = { title: string; fields: MatchStatField[] };

export const MATCH_STAT_GROUPS: MatchStatGroup[] = [
  {
    title: "Playing Time",
    fields: [{ key: "minutesPlayed", label: "Minutes Played" }],
  },
  {
    title: "Attacking",
    fields: [
      { key: "goals", label: "Goals" },
      { key: "assists", label: "Assists" },
      { key: "shots", label: "Shots" },
      { key: "shotsOnTarget", label: "Shots on Target" },
      { key: "keyPasses", label: "Key Passes" },
      { key: "dribbles", label: "Dribbles" },
    ],
  },
  {
    title: "Passing",
    fields: [
      { key: "passesAttempted", label: "Passes Attempted" },
      { key: "passesCompleted", label: "Passes Completed" },
    ],
  },
  {
    title: "Defending",
    fields: [
      { key: "tackles", label: "Tackles" },
      { key: "interceptions", label: "Interceptions" },
      { key: "recoveries", label: "Ball Recoveries" },
      { key: "turnovers", label: "Turnovers" },
    ],
  },
  {
    title: "Discipline",
    fields: [
      { key: "foulsCommitted", label: "Fouls Committed" },
      { key: "yellowCards", label: "Yellow Cards" },
      { key: "redCards", label: "Red Cards" },
    ],
  },
];

export const MATCH_STAT_KEYS = MATCH_STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));