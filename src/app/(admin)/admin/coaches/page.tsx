import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCoach } from "./actions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const rowStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e3ded2",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  alignItems: "center",
  gap: 16,
};

export default async function AdminCoachesPage() {
  const coaches = await prisma.coach.findMany({ include: { user: true, teams: true } });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>COACHES</h1>
        <Link href="/admin/coaches/new" className="button">+ Add Coach</Link>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {coaches.map((coach) => (
          <div key={coach.id} style={rowStyle}>
            <PlayerAvatar src={coach.photoUrl} alt={coach.user.name} size={48} rounded />
            <div style={{ flex: 1 }}>
              <strong>{coach.user.name}</strong>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                {coach.title ?? "Coach"} · {coach.teams.map((t) => t.name).join(", ") || "No teams assigned"}
              </div>
            </div>
            <Link href={`/admin/coaches/${coach.id}/edit`} style={{ marginRight: 16, fontSize: "0.9rem" }}>Edit</Link>
            <form action={deleteCoach.bind(null, coach.id)}>
              <button
                type="submit"
                style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
              >
                Remove
              </button>
            </form>
          </div>
        ))}
        {coaches.length === 0 && <p style={{ opacity: 0.7 }}>No coaches yet — click "Add Coach" to create the first one.</p>}
      </div>
    </div>
  );
}