import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { saveAttendance } from "../actions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "LATE", label: "Late" },
  { value: "ABSENT_EXCUSED", label: "Absent (excused)" },
  { value: "ABSENT_UNEXCUSED", label: "Absent (unexcused)" },
  { value: "INJURED", label: "Injured" },
];

export default async function LogAttendancePage({ params }: { params: { eventId: string } }) {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const event = await prisma.scheduleEvent.findUnique({
    where: { id: params.eventId },
    include: {
      team: { include: { players: { include: { user: true }, orderBy: { user: { name: "asc" } } } } },
      attendance: true,
    },
  });

  if (!event) return notFound();
  if (accessibleTeamIds && !accessibleTeamIds.includes(event.teamId)) return notFound();

  const existing = new Map(event.attendance.map((a) => [a.playerId, a]));
  const saveWithId = saveAttendance.bind(null, event.id);

  const cellStyle = { padding: "10px 8px", verticalAlign: "top" as const };

  return (
    <div>
      <Link href="/admin/training" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All sessions</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12 }}>
        {event.title.toUpperCase()}
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: 4 }}>
        {event.team.name} &middot; {event.startsAt.toLocaleString()}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      {event.team.players.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 32 }}>No players assigned to this team yet.</p>
      ) : (
        <form action={saveWithId} style={{ marginTop: 24, paddingBottom: 88 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                <th style={cellStyle}>Player</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Rating (1&ndash;5)</th>
                <th style={cellStyle}>Note</th>
              </tr>
            </thead>
            <tbody>
              {event.team.players.map((p) => {
                const record = existing.get(p.id);
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <PlayerAvatar src={p.photoUrl} alt={p.user.name} size={32} rounded />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.user.name}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{p.position ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <select
                        name={`status_${p.id}`}
                        defaultValue={record?.status ?? "PRESENT"}
                        style={{ padding: 8, width: "100%", maxWidth: 170 }}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={cellStyle}>
                      <select
                        name={`rating_${p.id}`}
                        defaultValue={record?.rating?.toString() ?? ""}
                        style={{ padding: 8, width: 70 }}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td style={cellStyle}>
                      <input
                        name={`note_${p.id}`}
                        defaultValue={record?.note ?? ""}
                        placeholder="Optional"
                        style={{ padding: 8, width: "100%" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--chalk)",
              paddingTop: 16,
              marginTop: 24,
              borderTop: "1px solid #e3ded2",
            }}
          >
            <button type="submit" className="button">Save attendance</button>
          </div>
        </form>
      )}
    </div>
  );
}