import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDate } from "@/lib/dates";

const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 20 };

export default async function ParentChildProfilePage({ params }: { params: { id: string } }) {
  const { player, child } = await requireOwnedChild(params.id);

  const notes = await prisma.progressNote.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
  });

  const details: [string, string][] = [
    ["Position", player.position ?? "Not set"],
    ["Shirt number", player.shirtNumber != null ? `#${player.shirtNumber}` : "Not set"],
    ["Team", player.team?.name ?? "Not yet assigned"],
    ["Date of birth", player.dateOfBirth ? formatDate(player.dateOfBirth) : "Not set"],
  ];

  return (
    <ChildPageShell child={child} active="profile">
      <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
        {details.map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)", margin: "32px 0 12px" }}>COACH NOTES</h2>
      {notes.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No notes yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notes.map((n) => (
            <div key={n.id} style={cardStyle}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{n.note}</p>
              <p style={{ fontSize: "0.8rem", opacity: 0.6, margin: "8px 0 0" }}>
                {n.authorName} &middot; {formatDate(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </ChildPageShell>
  );
}