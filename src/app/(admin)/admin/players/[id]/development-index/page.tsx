import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/assessmentAttributes";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { playerName } from "@/lib/playerDisplay";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 };

function ageFromDob(dob: Date): number {
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default async function DevelopmentIndexPage({ params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      assessments: { orderBy: { assessedAt: "desc" }, take: 1, include: { scores: true } },
      physicalTests: { orderBy: { testedAt: "desc" }, take: 1, include: { results: true } },
    },
  });
  if (!player) return notFound();

  const latestAssessment = player.assessments[0];
  const latestTest = player.physicalTests[0];

  const domainScores = DOMAINS.map((domain) => {
    const scores = latestAssessment?.scores.filter((s) => s.domain === domain) ?? [];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b.score, 0) / scores.length : null;
    return { label: DOMAIN_LABELS[domain], raw: avg, scaled: avg != null ? Math.round(avg * 20) : null };
  });

  const testScores = latestTest?.results.map((r) => r.score).filter((s): s is number => s != null) ?? [];
  const physicalTestAvg = testScores.length > 0 ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length) : null;

  const allInputs = [...domainScores.map((d) => d.scaled), physicalTestAvg].filter((v): v is number => v != null);
  const composite = allInputs.length > 0 ? Math.round(allInputs.reduce((a, b) => a + b, 0) / allInputs.length) : null;

  const age = player.dateOfBirth ? ageFromDob(player.dateOfBirth) : null;
  const canShowComposite = age != null && age >= 17;

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href={`/admin/players/${player.id}/reports`} style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; {playerName(player)}'s reports</Link>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 24 }}>
        DEVELOPMENT INDEX
      </h1>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>DOMAIN SCORES (0–100)</h2>
        {domainScores.map((d) => (
          <p key={d.label} style={{ fontSize: "0.9rem", margin: "4px 0" }}>
            {d.label}: <strong>{d.scaled ?? "—"}</strong>
          </p>
        ))}
        <p style={{ fontSize: "0.9rem", margin: "4px 0" }}>
          Physical Tests (avg): <strong>{physicalTestAvg ?? "—"}</strong>
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>COMPOSITE INDEX</h2>
        {canShowComposite ? (
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--pitch)" }}>{composite ?? "—"}<span style={{ fontSize: "1rem", opacity: 0.6 }}>/100</span></p>
        ) : (
          <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6 }}>
            A single composite score is withheld for players under 16. Development at this age is uneven across domains
            by design, and reducing it to one number can obscure real strengths and misdirect coaching focus. Use the
            domain scores above instead.
          </p>
        )}
        <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: 12 }}>
          Current weighting: equal weight across Technical, Tactical, Physical (coach), Mental, and the average Physical
          Test score. Adjust this if your academy uses a different weighting model.
        </p>
      </div>
    </div>
  );
}