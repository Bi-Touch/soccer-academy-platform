import { prisma } from "@/lib/prisma";

export default async function AdminSchedulePage() {
  const events = await prisma.scheduleEvent.findMany({
    include: { team: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>SCHEDULE</h1>
      {events.length === 0 && <p style={{ opacity: 0.7, marginTop: 24 }}>No events yet.</p>}
      {events.map((event) => (
        <div key={event.id} style={{ borderBottom: "1px solid #e3ded2", padding: "12px 0" }}>
          <strong>{event.title}</strong> — {event.team.name} — {event.startsAt.toLocaleString()}
        </div>
      ))}
      <p style={{ marginTop: 24, opacity: 0.7, fontSize: "0.9rem" }}>
        A create/edit form for events goes here next.
      </p>
    </div>
  );
}
