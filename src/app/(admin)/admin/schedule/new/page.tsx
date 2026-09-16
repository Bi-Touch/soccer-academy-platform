import { prisma } from "@/lib/prisma";
import { createEvent } from "../actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function NewEventPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD EVENT</h1>

      <form action={createEvent} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Team
          <select name="teamId" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            <option value="">Select a team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label>
          Type
          <select name="type" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            <option value="TRAINING">Training</option>
            <option value="MATCH">Match</option>
            <option value="DRILL">Drill</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Title
          <input name="title" required placeholder="e.g. vs Riverside FC" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Date & time
          <input name="startsAt" type="datetime-local" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Location (optional)
          <input name="location" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Opponent (for matches)
          <input name="opponent" placeholder="e.g. Riverside FC" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ flex: 1 }}>
            Home score (if played)
            <input name="homeScore" type="number" min={0} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>
            Away score (if played)
            <input name="awayScore" type="number" min={0} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
          </label>
        </div>

        <label>
          Description (optional)
          <textarea name="description" rows={3} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Create event</button>
      </form>
    </div>
  );
}