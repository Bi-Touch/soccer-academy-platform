import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { playerName } from "@/lib/playerDisplay";

export default async function ParentPlayerProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({ where: { userId: session.user.id } });
  if (!guardian) return notFound();

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { progressNotes: { orderBy: { createdAt: "desc" } }, team: true },
  });
  if (!player || player.parentGuardianId !== guardian.id) return notFound();

  return (
    <div>
      <Link href="/portal/parent" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; My Children</Link>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)", marginTop: 12 }}>
        {playerName(player).toUpperCase()}
      </h1>

      <div style={{ marginTop: 24, background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 32, maxWidth: 480, display: "flex", alignItems: "center", gap: 32 }}>
        <PlayerAvatar src={player.photoUrl ?? null} alt={playerName(player)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0 }}><strong>Name:</strong> {playerName(player)}</p>
          <p style={{ margin: 0 }}><strong>Position:</strong> {player.position ?? "Not set"}</p>
          <p style={{ margin: 0 }}><strong>Shirt number:</strong> {player.shirtNumber ?? "Not set"}</p>
          <p style={{ margin: 0 }}><strong>Team:</strong> {player.team?.name ?? "Unassigned"}</p>
          <p style={{ margin: 0 }}><strong>Date of birth:</strong> {player.dateOfBirth ? player.dateOfBirth.toLocaleDateString() : "Not set"}</p>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", marginTop: 40, marginBottom: 16 }}>
        COACH NOTES
      </h2>
      {player.progressNotes.length === 0 && <p style={{ opacity: 0.7 }}>No notes yet.</p>}
      {player.progressNotes.map((note) => (
        <div key={note.id} style={{ borderBottom: "1px solid #e3ded2", padding: "12px 0" }}>
          <p>{note.note}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
            — {note.authorName}, {note.createdAt.toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}