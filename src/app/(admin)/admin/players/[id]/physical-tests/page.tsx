import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { BarChart } from "@/components/BarChart";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";

export default async function PhysicalTestsPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const tests = await prisma.physicalTest.findMany({
    where: { playerId: params.id },
    include: { results: true },
    orderBy: { testedAt: "asc" },
  });

  const metricSeries = PHYSICAL_TEST_METRICS.map((m) => {
    const points = tests
      .map((t) => ({
        label: t.testedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: t.results.find((r) => r.metric === m.label)?.value,
      }))
      .filter((p): p is { label: string; value: number } => p.value !== undefined);
    return { metric: m, points };
  }).filter((s) => s.points.length > 0);

  return (
    <div>
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>
          {player.user.name.toUpperCase()} — PHYSICAL TESTS
        </h1>
        <Link href={`/admin/players/${player.id}/physical-tests/new`} className="button">+ New Test</Link>
      </div>

      {tests.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No physical tests recorded yet.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, marginTop: 32 }}>
            {metricSeries.map(({ metric, points }) => (
              <div key={metric.key}>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
                  {metric.label.toUpperCase()}
                </h2>
                <p style={{ fontSize: "0.75rem", opacity: 0.55, marginBottom: 12 }}>
                  {metric.unit} &middot; {metric.lowerIsBetter ? "lower is better" : "higher is better"}
                </p>
                <BarChart data={points} orientation="vertical" height={130} />
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
            FULL HISTORY
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                <th style={{ padding: "8px 0" }}>Date</th>
                <th>Tested by</th>
                {PHYSICAL_TEST_METRICS.map((m) => (
                  <th key={m.key}>{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...tests].reverse().map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                  <td style={{ padding: "8px 0" }}>{t.testedAt.toLocaleDateString()}</td>
                  <td>{t.testedBy ?? "—"}</td>
                  {PHYSICAL_TEST_METRICS.map((m) => {
                    const r = t.results.find((res) => res.metric === m.label);
                    return <td key={m.key}>{r ? `${r.value}${r.unit === "level" ? "" : ` ${r.unit}`}` : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}