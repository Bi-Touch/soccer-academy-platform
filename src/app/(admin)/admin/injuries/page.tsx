import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { SearchableTable } from "@/components/SearchableTable";
import { markRecovered } from "./actions";

export default async function AdminInjuriesPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const injuries = await prisma.injuryRecord.findMany({
    where: accessibleTeamIds ? { player: { teamId: { in: accessibleTeamIds } } } : undefined,
    include: { player: { include: { user: true, team: true } } },
    orderBy: { dateOccurred: "desc" },
  });

  const rows = injuries.map((i) => ({
    id: i.id,
    label: `${playerName(i.player)} ${i.injuryType} ${i.status}`,
    node: (
      <>
        <td style={{ padding: "10px 16px" }}>{playerName(i.player)}</td>
        <td style={{ padding: "10px 16px" }}>{i.player.team?.name ?? "—"}</td>
        <td style={{ padding: "10px 16px" }}>{i.injuryType}</td>
        <td style={{ padding: "10px 16px" }}>{i.dateOccurred.toLocaleDateString()}</td>
        <td style={{ padding: "10px 16px" }}>{i.expectedReturnDate ? i.expectedReturnDate.toLocaleDateString() : "—"}</td>
        <td style={{ padding: "10px 16px" }}>
          <span style={{ color: i.status === "ACTIVE" ? "var(--card-red)" : "var(--pitch)", fontWeight: 600, fontSize: "0.85rem" }}>
            {i.status}
          </span>
        </td>
        <td style={{ padding: "10px 16px", textAlign: "right" }}>
          {i.status === "ACTIVE" && (
            <form action={markRecovered.bind(null, i.id)}>
              <button type="submit" style={{ background: "none", border: "none", color: "var(--pitch)", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}>
                Mark recovered
              </button>
            </form>
          )}
        </td>
      </>
    ),
  }));

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>INJURIES</h1>
      <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 24, fontSize: "0.9rem" }}>
        Log a new injury from a player's Reports page. Tracked here so you can see who's currently unavailable at a glance.
      </p>

      <SearchableTable
        columns={["Player", "Team", "Injury", "Date", "Expected return", "Status", ""]}
        rows={rows}
        placeholder="Search by player, team, or injury type..."
        emptyMessage="No injuries logged."
      />
    </div>
  );
}