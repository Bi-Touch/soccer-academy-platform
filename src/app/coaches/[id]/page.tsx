import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CoachProfilePage({ params }: { params: { id: string } }) {
  const coach = await prisma.coach.findUnique({
    where: { id: params.id },
    include: { user: true, teams: true },
  });

  if (!coach) return notFound();

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 640 }}>
        <Link href="/coaches" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All coaches</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
          <PlayerAvatar src={coach.photoUrl} alt={coach.user.name} size={100} rounded />
          <div>
            <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>{coach.user.name}</h1>
            <p style={{ opacity: 0.75, marginTop: 4 }}>{coach.title ?? "Coach"}</p>
          </div>
        </div>

        {coach.bio && (
          <p style={{ marginTop: 32, lineHeight: 1.7, whiteSpace: "pre-line" }}>{coach.bio}</p>
        )}

        {coach.teams.length > 0 && (
          <>
            <h2 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", marginTop: 40, marginBottom: 12 }}>
              TEAMS
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {coach.teams.map((team) => (
                <span key={team.id} style={{ padding: "6px 14px", background: "white", borderLeft: "3px solid var(--floodlight)", fontSize: "0.9rem" }}>
                  {team.name}
                </span>
              ))}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </>
  );
}