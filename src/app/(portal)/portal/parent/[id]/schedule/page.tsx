import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { playerName } from "@/lib/playerDisplay";

export default async function ParentPlayerSchedulePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({ where: { userId: session.user.id } });
  if (!guardian) return notFound();

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { team: { include: { schedules: { orderBy: { startsAt: "asc" } } } } },
  });
  if (!player || player.parentGuardianId !== guardian.id) return notFound();

  return (
    <div>
      <Link href="/portal/parent" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; My Children</Link>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)", marginTop: 12 }}>
        {playerName(player).toUpperCase()} — SCHEDULE
      </h1>

      <div style={{ marginTop: 24 }}>
        {(!player.team?.schedules || player.team.schedules.length === 0) && (
          <p style={{ opacity: 0.7 }}>No events scheduled for this team yet.</p>
        )}
        {player.team?.schedules.map((event) => (
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