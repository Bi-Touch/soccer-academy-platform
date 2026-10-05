export type TestProtocol = {
  code: string;
  label: string;
  unit: string;
  lowerIsBetter: boolean;
  captures: string;
  steps: string[];
};

export const TEST_PROTOCOLS: TestProtocol[] = [
  {
    code: "10M_SPRINT",
    label: "10m Sprint",
    unit: "sec",
    lowerIsBetter: true,
    captures: "Acceleration — how quickly a player reaches top speed from a standing start.",
    steps: [
      "Mark a straight 10-metre course on a flat, non-slip surface.",
      "Player starts in a staggered stance with their lead foot on the start line — no rolling start.",
      "On their own signal, the player sprints maximally through the 10m mark.",
      "Time from first movement to the player's torso crossing the 10m line.",
      "Allow full recovery (2–3 minutes) between attempts; record the better of two attempts.",
    ],
  },
  {
    code: "30M_SPRINT",
    label: "30m Sprint",
    unit: "sec",
    lowerIsBetter: true,
    captures: "Maximum/top-end running speed over a longer distance than the 10m test.",
    steps: [
      "Mark a straight 30-metre course with a clear run-off area beyond the finish (no deceleration before the line).",
      "Same standing-start protocol as the 10m Sprint.",
      "Time continuously from first movement to the torso crossing the 30m line — one continuous sprint, not two measurements added together.",
      "Record the better of two maximal attempts, with full recovery between.",
    ],
  },
  {
    code: "505_COD",
    label: "Change of Direction (505)",
    unit: "sec",
    lowerIsBetter: true,
    captures: "Agility — the ability to decelerate, change direction sharply, and re-accelerate.",
    steps: [
      "Set a start line, a 15m approach line, and a turning line 5m beyond that (turning line is 20m from the start).",
      "Player sprints 15m to build speed, then continues through a timing gate placed 5m before the turning line.",
      "At the turning line, the player plants and turns 180°, sprinting back through the same 5m zone.",
      "Time only the 5m zone (gate-to-turn-to-gate) — the initial 15m is a run-up, not part of the timed segment.",
      "If testing both turning directions, log each as a separate test entry with a note on which foot was used.",
    ],
  },
  {
    code: "YOYO_IR1",
    label: "Yo-Yo IR1",
    unit: "m",
    lowerIsBetter: false,
    captures: "Intermittent (match-realistic) endurance — repeated high-intensity running with brief recovery.",
    steps: [
      "Set up two lines 20m apart, plus a 5m recovery zone behind one of them.",
      "Players run 20m out and 20m back in time with an audio beep, with a 10-second active recovery jog in the 5m zone between shuttles.",
      "The beep interval shortens progressively, forcing faster running each level.",
      "A player is out when they fail to reach the line in time with the beep on two consecutive occasions.",
      "Record the total distance covered (not the 'level' reached) — this is what the system stores and scores.",
    ],
  },
  {
    code: "CMJ",
    label: "Countermovement Jump (CMJ)",
    unit: "cm",
    lowerIsBetter: false,
    captures: "Lower-body explosive power.",
    steps: [
      "Player stands with hands on hips throughout (no arm swing, to isolate leg power).",
      "From standing, the player quickly dips into a quarter-squat and immediately jumps as high as possible.",
      "Measure jump height using a jump mat, contact mat, or validated phone app — not a wall-reach test.",
      "Record the best of three attempts, with ~30 seconds rest between jumps.",
    ],
  },
  {
    code: "RSA_6X20",
    label: "Repeated Sprint Ability (avg, 6x20m)",
    unit: "sec",
    lowerIsBetter: true,
    captures: "Ability to maintain sprint speed under fatigue.",
    steps: [
      "Mark a straight 20m course.",
      "Player performs 6 maximal 20m sprints, with exactly 20 seconds of passive recovery between each.",
      "Time every sprint individually.",
      "Record the average of all six sprint times as the single value entered into the system.",
    ],
  },
];

export const TRAINING_LOG_FIELDS = [
  { field: "Status", captures: "Whether the player attended", howTo: "Choose one: Present, Late, Absent (excused), Absent (unexcused), Injured. Use \"Late\" only if they missed meaningful session time." },
  { field: "Rating", captures: "Coach's quick, subjective rating of effort/performance", howTo: "Whole number 1–5. Optional — leave blank if you don't want to rate that session." },
  { field: "Note", captures: "Free-text context for the session", howTo: "Optional. Use for anything a rating alone doesn't capture." },
];

export const SCHEDULE_FIELDS = [
  { field: "Type", notes: "TRAINING, MATCH, DRILL, or OTHER. Determines where the event appears in other modules." },
  { field: "Title", notes: "Short name, e.g. \"Passing and High Press\" or \"vs Riverside FC\"." },
  { field: "Team", notes: "Which team the event belongs to." },
  { field: "Date/time", notes: "When it happens." },
  { field: "Location", notes: "Optional." },
  { field: "Opponent", notes: "Matches only, optional." },
  { field: "Home/away score", notes: "Matches only — enter once played." },
  { field: "Description", notes: "Optional — session plan, travel info, etc." },
];

export const MATCH_STAT_DEFINITIONS = [
  { field: "Minutes played", definition: "Total minutes the player was on the pitch" },
  { field: "Goals", definition: "Goals scored" },
  { field: "Assists", definition: "The pass or action directly leading to a goal" },
  { field: "Shots", definition: "Total shot attempts, on or off target" },
  { field: "Shots on target", definition: "Shots that would have gone in without a save or deflection" },
  { field: "Passes attempted", definition: "Total pass attempts" },
  { field: "Passes completed", definition: "Passes that successfully reached a teammate" },
  { field: "Key passes", definition: "A pass that directly leads to a teammate's shot attempt" },
  { field: "Dribbles", definition: "Successful take-ons past an opponent" },
  { field: "Tackles", definition: "Successful challenges winning the ball from an opponent" },
  { field: "Interceptions", definition: "Reading and cutting out an opponent's pass" },
  { field: "Recoveries", definition: "Regaining possession of a loose/uncontrolled ball" },
  { field: "Turnovers", definition: "Losing possession through a misplaced pass, poor touch, or dispossession" },
  { field: "Fouls committed", definition: "Fouls the player gave away" },
  { field: "Yellow cards", definition: "" },
  { field: "Red cards", definition: "" },
];

export const ASSESSMENT_RATING_SCALE = [
  { score: 1, meaning: "Significant development needed for their age/level" },
  { score: 2, meaning: "Below expected level" },
  { score: 3, meaning: "Meeting expected level" },
  { score: 4, meaning: "Above expected level" },
  { score: 5, meaning: "Excellent, standout for their age/level" },
];

export const ASSESSMENT_DOMAIN_GUIDE: Record<string, { attribute: string; lookFor: string }[]> = {
  Technical: [
    { attribute: "Passing", lookFor: "Accuracy and appropriateness of pass selection and weight" },
    { attribute: "First Touch", lookFor: "Control and composure receiving the ball under pressure" },
    { attribute: "Dribbling", lookFor: "Ability to beat an opponent in 1v1 situations" },
    { attribute: "Finishing", lookFor: "Composure and technique in shooting situations" },
    { attribute: "Crossing", lookFor: "Delivery quality from wide areas" },
    { attribute: "Ball Control", lookFor: "General comfort and close control of the ball" },
  ],
  Tactical: [
    { attribute: "Positioning", lookFor: "Awareness of where to be, in and out of possession" },
    { attribute: "Decision-Making", lookFor: "Choosing the right option under time pressure" },
    { attribute: "Scanning", lookFor: "Checking surroundings before receiving the ball" },
    { attribute: "Defensive Awareness", lookFor: "Reading danger and recovering defensive shape" },
    { attribute: "Understanding Space", lookFor: "Exploiting or denying space appropriately" },
  ],
  Physical: [
    { attribute: "Speed", lookFor: "In-game running speed (distinct from the timed Physical Test)" },
    { attribute: "Acceleration", lookFor: "Burst over short distances in match situations" },
    { attribute: "Agility", lookFor: "Change of direction in match situations" },
    { attribute: "Endurance", lookFor: "Ability to maintain intensity across a full session/match" },
    { attribute: "Work Rate", lookFor: "Overall effort and application" },
  ],
  "Mental / Behavioral": [
    { attribute: "Concentration", lookFor: "Sustained focus across a session/match" },
    { attribute: "Communication", lookFor: "Talking to teammates, organizing, encouraging" },
    { attribute: "Discipline", lookFor: "Following instructions, self-control" },
    { attribute: "Coachability", lookFor: "Receptiveness to feedback and willingness to improve" },
    { attribute: "Confidence", lookFor: "Willingness to take responsibility/risk on the ball" },
  ],
};