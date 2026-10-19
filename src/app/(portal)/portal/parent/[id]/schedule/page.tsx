import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDateTime } from "@/lib/dates";

type EventItem = Awaited<ReturnType<typeof prisma.scheduleEvent.findMany>>[number];

function EventCard({ e, muted = false }: { e: EventItem; muted?: boolean }) {
  const hasScore = e.type === "MATCH" && e.homeScore !== null && e.awayScore !== null;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e3ded2",
        borderLeft: "4px solid var(--floodlight)",
        borderRadius: 8,
        padding: 16,
        opacity: muted ? 0.8 : 1,
      }}
    >
      <div style={{ fontSize: "0.7rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{e.type}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{e.title}</div>
      <div style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: 4 }}>
        {formatDateTime(e.startsAt)}
        {e.location ? ` · ${e.location}` : ""}
      </div>
      {hasScore && (
        <div style={{ fontSize: "0.85rem", marginTop: 6, fontWeight: 600, color: "var(--pitch)" }}>
          Result: {e.homeScore} – {e.awayScore}
        </div>
      )}
    </div>
  );
}

export default async function ParentChildSchedulePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { player, child } = await requireOwnedChild(params.id);

  const events = player.teamId
    ? await prisma.scheduleEvent.findMany({ where: { teamId: player.teamId }, orderBy: { startsAt: "asc" } })
    : [];

  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const recent = events.filter((e) => e.startsAt < now).reverse().slice(0, 10);

  return (
    <ChildPageShell child={child} active="schedule">
      {!player.teamId ? (
        <p style={{ opacity: 0.7 }}>Your child hasn't been assigned to a team yet, so there's no schedule to show.</p>
      ) : (
        <>
          <h2 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", marginBottom: 12 }}>UPCOMING</h2>
          {upcoming.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Nothing scheduled yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcoming.map((e) => <EventCard key={e.id} e={e} />)}
            </div>
          )}

          {recent.length > 0 && (
            <>
              <h2 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", margin: "32px 0 12px" }}>RECENT</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recent.map((e) => <EventCard key={e.id} e={e} muted />)}
              </div>
            </>
          )}
        </>
      )}
    </ChildPageShell>
  );
}