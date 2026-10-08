import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20 };

async function loadSummary(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      team: true,
      stats: { orderBy: { season: "desc" }, take: 1 },
      assessments: { orderBy: { assessedAt: "desc" }, take: 1, include: { scores: true } },
      physicalTests: { orderBy: { testedAt: "desc" }, take: 1, include: { results: true } },
    },
  });
  if (!player) return null;

  const latestStat = player.stats[0];
  const latestAssessment = player.assessments[0];

  const domainAverages = DOMAINS.map((domain) => {
    const scores = latestAssessment?.scores.filter((s) => s.domain === domain) ?? [];
    const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b.score, 0) / scores.length) * 10) / 10 : null;
    return { label: DOMAIN_LABELS[domain], value: avg };
  });

  const latestTest = player.physicalTests[0];
  const testScores = PHYSICAL_TEST_METRICS.map((m) => ({
    label: m.label,
    score: latestTest?.results.find((r) => r.metric === m.label)?.score ?? null,
  }));

  return { player, latestStat, domainAverages, testScores };
}

export default async function PlayerComparePage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const players = await prisma.player.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { user: true },
  });

  const summaryA = searchParams.a ? await loadSummary(searchParams.a) : null;
  const summaryB = searchParams.b ? await loadSummary(searchParams.b) : null;

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>COMPARE PLAYERS</h1>

      <form method="GET" style={{ display: "flex", gap: 16, marginTop: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <select name="a" defaultValue={searchParams.a ?? ""} style={{ padding: 10 }}>
          <option value="">Select player A</option>
          {players.map((p) => <option key={p.id} value={p.id}>{playerName(p)}</option>)}
        </select>
        <select name="b" defaultValue={searchParams.b ?? ""} style={{ padding: 10 }}>
          <option value="">Select player B</option>
          {players.map((p) => <option key={p.id} value={p.id}>{playerName(p)}</option>)}
        </select>
        <button type="submit" className="button">Compare</button>
      </form>

      {summaryA && summaryB ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[summaryA, summaryB].map((s, i) => (
            <div key={i} style={cardStyle}>
              <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginBottom: 4 }}>{playerName(s.player)}</h2>
              <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: 16 }}>{s.player.team?.name ?? "No team"} · {s.player.position ?? "—"}</p>

              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>SEASON STATS</h3>
              <p style={{ fontSize: "0.9rem" }}>
                {s.latestStat ? `${s.latestStat.matchesPlayed} matches · ${s.latestStat.goals}G · ${s.latestStat.assists}A · ${s.latestStat.minutesPlayed} mins` : "No stats recorded"}
              </p>

              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", margin: "16px 0 8px" }}>LATEST ASSESSMENT</h3>
              {s.domainAverages.map((d) => (
                <p key={d.label} style={{ fontSize: "0.85rem", margin: "2px 0" }}>{d.label}: <strong>{d.value ?? "—"}</strong>/5</p>
              ))}

              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", margin: "16px 0 8px" }}>LATEST PHYSICAL TEST SCORES</h3>
              {s.testScores.map((t) => (
                <p key={t.label} style={{ fontSize: "0.85rem", margin: "2px 0" }}>{t.label}: <strong>{t.score ?? "—"}</strong>{t.score != null ? "/100" : ""}</p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ opacity: 0.7 }}>Select two players to compare.</p>
      )}
    </div>
  );
}