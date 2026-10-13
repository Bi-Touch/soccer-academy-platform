import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { ChildCard } from "@/components/parent/ChildCard";

export default async function ParentDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({
    where: { userId: user.id },
    include: { players: { include: { team: true }, orderBy: { name: "asc" } } },
  });

  const players = guardian?.players ?? [];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>MY CHILDREN</h1>

      {players.length === 0 ? (
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          No players are linked to your account yet. If this seems wrong, contact the Academy.
        </p>
      ) : (
        <>
          {players.length > 1 && (
            <p style={{ opacity: 0.65, fontSize: "0.9rem", marginTop: 4 }}>Tap a child to open their menu.</p>
          )}
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {players.map((p) => (
              <ChildCard
                key={p.id}
                id={p.id}
                name={playerName(p)}
                photoUrl={p.photoUrl ?? null}
                teamName={p.team?.name ?? null}
                position={p.position}
                defaultOpen={players.length === 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}