import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { playerName } from "@/lib/playerDisplay";

export default async function ParentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({
    where: { userId: session.user.id },
    include: { players: { include: { team: true } } },
  });

  if (!guardian) {
    return (
      <div>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>MY CHILDREN</h1>
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          No players are linked to your account yet. If this seems wrong, contact the Academy.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>MY CHILDREN</h1>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {guardian.players.map((p) => (
          <div
            key={p.id}
            style={{
              background: "white",
              border: "1px solid #e3ded2",
              borderRadius: 8,
              padding: 16,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
            }}
          >
            <PlayerAvatar src={p.photoUrl} alt={playerName(p)} size={48} rounded />
            <div style={{ flex: "1 1 200px" }}>
              <strong>{playerName(p)}</strong>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>
                {p.team?.name ?? "Not yet assigned to a team"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href={`/portal/parent/${p.id}/profile`} style={{ fontSize: "0.9rem" }}>Profile</Link>
              <Link href={`/portal/parent/${p.id}/stats`} style={{ fontSize: "0.9rem" }}>Stats</Link>
              <Link href={`/portal/parent/${p.id}/schedule`} style={{ fontSize: "0.9rem" }}>Schedule</Link>
              <Link href={`/portal/parent/${p.id}/consent`} style={{ fontSize: "0.9rem" }}>Consent</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}