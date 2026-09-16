import { prisma } from "@/lib/prisma";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { assignPlayerToTeam } from "../actions";
import { redirect } from "next/navigation";
import { computeAgeGroup } from "@/lib/age";
import { AssignPlayerDirectory } from "@/components/AssignPlayerDirectory";

export default async function AssignPlayerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const [unassignedPlayers, teams] = await Promise.all([
    prisma.player.findMany({ where: { teamId: null }, include: { user: true } }),
    prisma.team.findMany({ where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined }),
  ]);

  const rows = unassignedPlayers.map((p) => ({
    id: p.id,
    name: p.user.name,
    position: p.position,
    ageGroup: computeAgeGroup(p.dateOfBirth),
  }));

  const ageGroups = [...new Set(rows.map((r) => r.ageGroup))].sort();
  const positions = [...new Set(rows.map((r) => r.position).filter(Boolean))] as string[];

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)", marginBottom: 24 }}>
        ADD PLAYER TO TEAM
      </h1>

      {rows.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No unassigned players available. Ask an admin to register one first.</p>
      ) : (
        <AssignPlayerDirectory
          players={rows}
          teams={teams}
          ageGroups={ageGroups}
          positions={positions}
          assignAction={assignPlayerToTeam}
        />
      )}
    </div>
  );
}