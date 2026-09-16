import { prisma } from "@/lib/prisma";
import { updateEvent } from "../../actions";
import { notFound } from "next/navigation";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const event = await prisma.scheduleEvent.findUnique({ where: { id: params.id } });
  if (!event) return notFound();
  if (accessibleTeamIds && !accessibleTeamIds.includes(event.teamId)) return notFound();

  const updateWithId = updateEvent.bind(null, event.id);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>EDIT EVENT</h1>

      <form action={updateWithId} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Type
          <select name="type" defaultValue={event.type} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            <option value="TRAINING">Training</option>
            <option value="MATCH">Match</option>
            <option value="DRILL">Drill</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Title
          <input name="title" defaultValue={event.title} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Date & time
          <input name="startsAt" type="datetime-local" defaultValue={toLocalInputValue(event.startsAt)} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Location (optional)
          <input name="location" defaultValue={event.location ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Opponent (for matches)
          <input name="opponent" defaultValue={event.opponent ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ flex: 1 }}>
            Home score (if played)
            <input name="homeScore" type="number" min={0} defaultValue={event.homeScore ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>
            Away score (if played)
            <input name="awayScore" type="number" min={0} defaultValue={event.awayScore ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
          </label>
        </div>

        <label>
          Description (optional)
          <textarea name="description" rows={3} defaultValue={event.description ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Save changes</button>
      </form>
    </div>
  );
}