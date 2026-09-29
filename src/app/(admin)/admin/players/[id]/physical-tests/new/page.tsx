import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { createPhysicalTest } from "../actions";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import { playerName } from "@/lib/playerDisplay";

export default async function NewPhysicalTestPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();
  if (accessibleTeamIds && (!player.teamId || !accessibleTeamIds.includes(player.teamId))) {
    return notFound();
  }

  const createWithId = createPhysicalTest.bind(null, player.id);
  const today = new Date().toISOString().slice(0, 10);
  const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
  const canScore = Boolean(player.dateOfBirth && player.sex);

  return (
    <div>
      <Link href="/admin/physical-tests" style={{ fontSize: "0.9rem", opacity: 0.7 }}>
        &larr; All physical tests
      </Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 24 }}>
        NEW PHYSICAL TEST
      </h1>

      {!canScore && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 24, maxWidth: 480 }}>
          <p style={{ fontSize: "0.85rem", color: "var(--pitch)" }}>
            {playerName(player)} is missing a date of birth and/or sex, so results saved here won't be scored against benchmarks yet. Add both under Edit Player to enable scoring.
          </p>
        </div>
      )}

      <form action={createWithId} style={{ maxWidth: 480, paddingBottom: 88 }}>
        <label style={{ fontSize: "0.85rem" }}>
          Test date
          <input name="testedAt" type="date" defaultValue={today} style={inputStyle} />
        </label>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {PHYSICAL_TEST_METRICS.map((m) => (
            <label key={m.key} style={{ fontSize: "0.85rem" }}>
              {m.label} <span style={{ opacity: 0.5 }}>({m.unit})</span>
              <input
                name={`value_${m.key}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank if not tested"
                style={inputStyle}
              />
            </label>
          ))}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: "var(--chalk)", paddingTop: 16, marginTop: 24, borderTop: "1px solid #e3ded2" }}>
          <SubmitButton>Save test results</SubmitButton>
        </div>
      </form>
    </div>
  );
}