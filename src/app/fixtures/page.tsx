import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export default async function FixturesPage() {
  const matches = await prisma.scheduleEvent.findMany({
    where: { type: "MATCH" },
    include: { team: true },
    orderBy: { startsAt: "desc" },
  });

  const now = new Date();
  const upcoming = matches.filter((m) => m.startsAt > now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const results = matches.filter((m) => m.startsAt <= now);

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          FIXTURES &amp; RESULTS
        </h1>

        <h2 className="display" style={{ fontSize: "1.5rem", color: "var(--pitch)", marginBottom: 12 }}>Upcoming</h2>
        {upcoming.length === 0 && <p style={{ opacity: 0.7, marginBottom: 32 }}>No upcoming fixtures scheduled.</p>}
        {upcoming.map((m) => (
          <div key={m.id} style={{ borderBottom: "1px solid #e3ded2", padding: "14px 0", display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{m.team.name}</strong> vs {m.opponent ?? "TBC"}
              {m.location && <span style={{ opacity: 0.6 }}> — {m.location}</span>}
            </div>
            <div style={{ opacity: 0.75, fontSize: "0.9rem" }}>{m.startsAt.toLocaleString()}</div>
          </div>
        ))}

        <h2 className="display" style={{ fontSize: "1.5rem", color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>Results</h2>
        {results.length === 0 && <p style={{ opacity: 0.7 }}>No results yet.</p>}
        {results.map((m) => (
          <div key={m.id} style={{ borderBottom: "1px solid #e3ded2", padding: "14px 0", display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{m.team.name}</strong> vs {m.opponent ?? "Unknown"}
            </div>
            <div style={{ fontWeight: 600 }}>
              {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : "—"}
            </div>
          </div>
        ))}
      </section>
      <SiteFooter />
    </>
  );
}