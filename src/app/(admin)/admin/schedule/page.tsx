import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteEvent } from "./actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function AdminSchedulePage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const events = await prisma.scheduleEvent.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { team: true },
    orderBy: { startsAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>SCHEDULE</h1>
        <Link href="/admin/schedule/new" className="button">+ Add Event</Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
              <th style={{ padding: "8px 0" }}>Title</th>
              <th>Team</th>
              <th>Type</th>
              <th>Date</th>
              <th>Result</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                <td style={{ padding: "8px 0" }}>{event.title}</td>
                <td>{event.team.name}</td>
                <td>{event.type}</td>
                <td style={{ whiteSpace: "nowrap" }}>{event.startsAt.toLocaleString()}</td>
                <td>
                  {event.type === "MATCH" && event.homeScore !== null && event.awayScore !== null
                    ? `${event.homeScore} - ${event.awayScore}`
                    : "—"}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <Link href={`/admin/schedule/${event.id}/edit`} style={{ marginRight: 16, fontSize: "0.9rem" }}>
                    Edit
                  </Link>
                  <form action={deleteEvent.bind(null, event.id)} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px 0", opacity: 0.7 }}>
                  {accessibleTeamIds && accessibleTeamIds.length === 0
                    ? "You aren't assigned to any teams yet."
                    : 'No events yet — click "Add Event" to create the first one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}