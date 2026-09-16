import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { prisma } from "@/lib/prisma";

export default async function CoachesPage() {
  const coaches = await prisma.coach.findMany({ include: { user: true, teams: true } });

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px" }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)", marginBottom: 40 }}>
          OUR COACHES
        </h1>
        {coaches.length === 0 && <p style={{ opacity: 0.7 }}>No coaches listed yet.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 32 }}>
          {coaches.map((coach) => (
            <Link key={coach.id} href={`/coaches/${coach.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <PlayerAvatar src={coach.photoUrl} alt={coach.user.name} size={120} rounded />
              <div className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", marginTop: 12 }}>
                {coach.user.name}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                {coach.title ?? "Coach"}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}