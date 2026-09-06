import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: { team: { include: { schedules: { orderBy: { startsAt: "asc" } } } } },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>SCHEDULE</h1>
      <div style={{ marginTop: 24 }}>
        {(!player?.team?.schedules || player.team.schedules.length === 0) && (
          <p style={{ opacity: 0.7 }}>No events scheduled for your team yet.</p>
        )}
        {player?.team?.schedules.map((event) => (
          <div key={event.id} style={{ background: "white", borderLeft: "4px solid var(--floodlight)", padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: "0.8rem", opacity: 0.6, textTransform: "uppercase" }}>{event.type}</div>
            <strong>{event.title}</strong>
            <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>
              {event.startsAt.toLocaleString()} {event.location ? `· ${event.location}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
