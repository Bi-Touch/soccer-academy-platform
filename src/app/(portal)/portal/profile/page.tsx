import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: { progressNotes: { orderBy: { createdAt: "desc" } }, team: true },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>MY PROFILE</h1>

      <div style={{ marginTop: 24, background: "white", padding: 24, maxWidth: 480 }}>
        <p><strong>Name:</strong> {session?.user?.name}</p>
        <p><strong>Position:</strong> {player?.position ?? "Not set"}</p>
        <p><strong>Shirt number:</strong> {player?.shirtNumber ?? "Not set"}</p>
        <p><strong>Team:</strong> {player?.team?.name ?? "Unassigned"}</p>
      </div>

      <h2 className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", marginTop: 40, marginBottom: 16 }}>
        COACH NOTES
      </h2>
      {player?.progressNotes.length === 0 && <p style={{ opacity: 0.7 }}>No notes yet.</p>}
      {player?.progressNotes.map((note) => (
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
