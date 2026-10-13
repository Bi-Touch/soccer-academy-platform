import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { playerName } from "@/lib/playerDisplay";
import { DOMAINS, DOMAIN_LABELS, ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { MATCH_STAT_GROUPS } from "@/lib/matchStats";

export type AnalyticsFilters = { teamId?: string; from?: string; to?: string };
export type TableRow = { id: string; cells: string[] };
export type TableData = { columns: string[]; rows: TableRow[]; truncated: boolean; stickyCol: number };
export type Kpi = { label: string; value: string; hint?: string };

export const ROW_LIMIT = 2000;

export const TABS = [
  { key: "players", label: "Players" },
  { key: "training", label: "Training" },
  { key: "matches", label: "Matches" },
  { key: "assessments", label: "Assessments" },
  { key: "physical", label: "Physical Tests" },
  { key: "injuries", label: "Injuries" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export function isTabKey(v: string | undefined): v is TabKey {
  return TABS.some((t) => t.key === v);
}

const DASH = "—";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(n) ? DASH : String(Math.round(n * 10 ** digits) / 10 ** digits);
const ageOf = (dob: Date | null) => (dob ? String(Math.floor((Date.now() - dob.getTime()) / 31557600000)) : DASH);
const sexLabel = (s: string | null) => (s === "MALE" ? "Male" : s === "FEMALE" ? "Female" : DASH);

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT_EXCUSED: "Absent (excused)",
  ABSENT_UNEXCUSED: "Absent (unexcused)",
  INJURED: "Injured",
};

const LABELS = DOMAIN_LABELS as Record<string, string>;
const ATTRS = ASSESSMENT_ATTRIBUTES as Record<string, string[]>;

function dateRange(f: AnalyticsFilters): Prisma.DateTimeFilter | undefined {
  const out: Prisma.DateTimeFilter = {};
  const gte = f.from ? new Date(`${f.from}T00:00:00`) : undefined;
  const lte = f.to ? new Date(`${f.to}T23:59:59.999`) : undefined;
  if (gte && !isNaN(gte.getTime())) out.gte = gte;
  if (lte && !isNaN(lte.getTime())) out.lte = lte;
  return Object.keys(out).length ? out : undefined;
}

function playerScope(f: AnalyticsFilters, accessible: string[] | null): Prisma.PlayerWhereInput {
  if (f.teamId) {
    if (accessible && !accessible.includes(f.teamId)) return { id: "__no_access__" }; // matches nothing
    return { teamId: f.teamId };
  }
  return accessible ? { teamId: { in: accessible } } : {};
}

export async function loadTeams(accessible: string[] | null) {
  return prisma.team.findMany({
    where: accessible ? { id: { in: accessible } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function loadKpis(f: AnalyticsFilters, accessible: string[] | null): Promise<Kpi[]> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);
  const eventDate = r ? { event: { startsAt: r } } : {};

  const [players, attendance, matches, goalAgg, activeInjuries, assessments, testAvg] = await Promise.all([
    prisma.player.count({ where: scope }),
    prisma.trainingAttendance.findMany({ where: { player: scope, ...eventDate }, select: { status: true, rating: true } }),
    prisma.matchPerformance.findMany({ where: { player: scope, ...eventDate }, distinct: ["eventId"], select: { eventId: true } }),
    prisma.matchPerformance.aggregate({ where: { player: scope, ...eventDate }, _sum: { goals: true, assists: true } }),
    prisma.injuryRecord.count({ where: { player: scope, status: "ACTIVE" } }),
    prisma.developmentAssessment.count({ where: { player: scope, ...(r ? { assessedAt: r } : {}) } }),
    prisma.physicalTestResult.aggregate({
      where: { score: { not: null }, test: { player: scope, ...(r ? { testedAt: r } : {}) } },
      _avg: { score: true },
    }),
  ]);

  const attended = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const rate = attendance.length ? (attended / attendance.length) * 100 : null;
  const ratings = attendance.map((a) => a.rating).filter((x): x is number => x != null);
  const avgRating = mean(ratings);

  return [
    { label: "Players", value: String(players) },
    { label: "Training attendance", value: rate == null ? DASH : `${fmt(rate, 0)}%`, hint: `${attendance.length} records` },
    { label: "Avg session rating", value: avgRating == null ? DASH : `${fmt(avgRating)}/5` },
    { label: "Matches logged", value: String(matches.length) },
    { label: "Goals", value: String(goalAgg._sum.goals ?? 0), hint: `${goalAgg._sum.assists ?? 0} assists` },
    { label: "Assessments", value: String(assessments) },
    { label: "Avg physical score", value: fmt(testAvg._avg.score, 0), hint: "out of 100" },
    { label: "Active injuries", value: String(activeInjuries), hint: "right now" },
  ];
}

export async function loadTable(tab: TabKey, f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  switch (tab) {
    case "players": return loadPlayers(f, accessible);
    case "training": return loadTraining(f, accessible);
    case "matches": return loadMatches(f, accessible);
    case "assessments": return loadAssessments(f, accessible);
    case "physical": return loadPhysical(f, accessible);
    case "injuries": return loadInjuries(f, accessible);
  }
}

function finish(columns: string[], all: TableRow[], stickyCol: number): TableData {
  return { columns, rows: all.slice(0, ROW_LIMIT), truncated: all.length > ROW_LIMIT, stickyCol };
}

async function loadPlayers(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);

  const players = await prisma.player.findMany({
    where: scope,
    include: {
      user: true,
      team: true,
      trainingAttendance: { where: r ? { event: { startsAt: r } } : undefined, select: { status: true, rating: true } },
      matchPerformances: { where: r ? { event: { startsAt: r } } : undefined, select: { goals: true, assists: true, minutesPlayed: true } },
      assessments: { orderBy: { assessedAt: "desc" }, take: 1, include: { scores: true } },
      injuryRecords: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
    take: ROW_LIMIT + 1,
  });

  const rows = players.map((p) => {
    const att = p.trainingAttendance;
    const attended = att.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const ratings = att.map((a) => a.rating).filter((x): x is number => x != null);
    const latest = p.assessments[0];
    return {
      id: p.id,
      cells: [
        playerName(p),
        p.team?.name ?? DASH,
        ageOf(p.dateOfBirth),
        sexLabel(p.sex),
        p.position ?? DASH,
        String(att.length),
        att.length ? `${Math.round((attended / att.length) * 100)}%` : DASH,
        fmt(mean(ratings)),
        String(p.matchPerformances.filter((m) => m.minutesPlayed > 0).length),
        String(p.matchPerformances.reduce((s, m) => s + m.goals, 0)),
        String(p.matchPerformances.reduce((s, m) => s + m.assists, 0)),
        String(p.matchPerformances.reduce((s, m) => s + m.minutesPlayed, 0)),
        latest ? fmt(mean(latest.scores.map((s) => s.score))) : DASH,
        p.injuryRecords.length ? "Yes" : "No",
      ],
    };
  });

  return finish(
    ["Player", "Team", "Age", "Sex", "Position", "Sessions", "Attendance", "Avg rating", "Matches", "Goals", "Assists", "Minutes", "Assessment avg (/5)", "Injured"],
    rows,
    0
  );
}

async function loadTraining(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);

  const records = await prisma.trainingAttendance.findMany({
    where: { player: scope, ...(r ? { event: { startsAt: r } } : {}) },
    include: { player: { include: { user: true, team: true } }, event: true },
    orderBy: { event: { startsAt: "desc" } },
    take: ROW_LIMIT + 1,
  });

  const rows = records.map((a) => ({
    id: a.id,
    cells: [
      iso(a.event.startsAt),
      a.player.team?.name ?? DASH,
      a.event.title,
      playerName(a.player),
      STATUS_LABELS[a.status] ?? a.status,
      a.rating != null ? String(a.rating) : DASH,
      a.note ?? "",
    ],
  }));

  return finish(["Date", "Team", "Session", "Player", "Status", "Rating", "Note"], rows, 3);
}

async function loadMatches(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);
  const fields = MATCH_STAT_GROUPS.flatMap((g) => g.fields);

  const perfs = await prisma.matchPerformance.findMany({
    where: { player: scope, ...(r ? { event: { startsAt: r } } : {}) },
    include: { player: { include: { user: true, team: true } }, event: true },
    orderBy: { event: { startsAt: "desc" } },
    take: ROW_LIMIT + 1,
  });

  const rows = perfs.map((p) => ({
    id: p.id,
    cells: [
      iso(p.event.startsAt),
      p.player.team?.name ?? DASH,
      p.event.title,
      playerName(p.player),
      ...fields.map((fl) => String((p as unknown as Record<string, number>)[fl.key] ?? 0)),
    ],
  }));

  return finish(["Date", "Team", "Match", "Player", ...fields.map((fl) => fl.label)], rows, 3);
}

async function loadAssessments(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);
  const attributeNames = Object.values(ATTRS).flat();

  const assessments = await prisma.developmentAssessment.findMany({
    where: { player: scope, ...(r ? { assessedAt: r } : {}) },
    include: { player: { include: { user: true, team: true } }, scores: true },
    orderBy: { assessedAt: "desc" },
    take: ROW_LIMIT + 1,
  });

  const rows = assessments.map((a) => {
    const byAttr = new Map(a.scores.map((s) => [s.attribute, s.score]));
    return {
      id: a.id,
      cells: [
        iso(a.assessedAt),
        a.player.team?.name ?? DASH,
        playerName(a.player),
        a.assessedBy ?? DASH,
        ...DOMAINS.map((d) =>
          fmt(mean(a.scores.filter((s) => (s.domain as string) === (d as string)).map((s) => s.score)))
        ),
        ...attributeNames.map((n) => (byAttr.has(n) ? String(byAttr.get(n)) : DASH)),
      ],
    };
  });

  return finish(
    ["Date", "Team", "Player", "Assessed by", ...DOMAINS.map((d) => `${LABELS[d as string] ?? d} avg`), ...attributeNames],
    rows,
    2
  );
}

async function loadPhysical(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);

  const tests = await prisma.physicalTest.findMany({
    where: { player: scope, ...(r ? { testedAt: r } : {}) },
    include: { player: { include: { user: true, team: true } }, results: true },
    orderBy: { testedAt: "desc" },
    take: ROW_LIMIT + 1,
  });

  const rows = tests.map((t) => ({
    id: t.id,
    cells: [
      iso(t.testedAt),
      t.player.team?.name ?? DASH,
      playerName(t.player),
      t.ageGroup ?? DASH,
      t.testedBy ?? DASH,
      ...PHYSICAL_TEST_METRICS.flatMap((m) => {
        const res = t.results.find((x) => x.metric === m.label);
        return [res ? String(res.value) : DASH, res?.score != null ? fmt(res.score, 0) : DASH];
      }),
    ],
  }));

  return finish(
    ["Date", "Team", "Player", "Age group", "Tested by", ...PHYSICAL_TEST_METRICS.flatMap((m) => [`${m.label} (${m.unit})`, `${m.label} score`])],
    rows,
    2
  );
}

async function loadInjuries(f: AnalyticsFilters, accessible: string[] | null): Promise<TableData> {
  const scope = playerScope(f, accessible);
  const r = dateRange(f);

  const injuries = await prisma.injuryRecord.findMany({
    where: { player: scope, ...(r ? { dateOccurred: r } : {}) },
    include: { player: { include: { user: true, team: true } } },
    orderBy: { dateOccurred: "desc" },
    take: ROW_LIMIT + 1,
  });

  const rows = injuries.map((i) => {
    const end = i.status === "ACTIVE" ? new Date() : i.actualReturnDate;
    const days = end ? String(Math.max(0, Math.round((end.getTime() - i.dateOccurred.getTime()) / 86400000))) : DASH;
    return {
      id: i.id,
      cells: [
        playerName(i.player),
        i.player.team?.name ?? DASH,
        i.injuryType,
        iso(i.dateOccurred),
        i.expectedReturnDate ? iso(i.expectedReturnDate) : DASH,
        i.actualReturnDate ? iso(i.actualReturnDate) : DASH,
        i.status,
        days,
      ],
    };
  });

  return finish(["Player", "Team", "Injury", "Occurred", "Expected return", "Actual return", "Status", "Days out"], rows, 0);
}