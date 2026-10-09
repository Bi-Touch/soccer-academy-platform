import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { exportTrainingLog } from "./actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { SearchableTable } from "@/components/SearchableTable";

export default async function TrainingListPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const sessions = await prisma.scheduleEvent.findMany({
    where: {
      type: { in: ["TRAINING", "DRILL"] },
      ...(accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : {}),
    },
    include: {
      team: { include: { _count: { select: { players: true } } } },
      _count: { select: { attendance: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  const rows = sessions.map((s) => {
    const logged = s._count.attendance;
    const squad = s.team._count.players;
    return {
      id: s.id,
      label: `${s.title} ${s.team.name}`,
      node: (
        <>
          <td style={{ padding: "10px 16px" }}>{s.title}</td>
          <td style={{ padding: "10px 16px" }}>{s.team.name}</td>
          <td style={{ padding: "10px 16px" }}>{s.startsAt.toLocaleDateString()}</td>
          <td style={{ padding: "10px 16px" }}>
            {logged === 0 ? (
              <span style={{ color: "var(--card-red)", fontSize: "0.85rem" }}>Not logged</span>
            ) : (
              <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>{logged}/{squad}</span>
            )}
          </td>
          <td style={{ padding: "10px 16px", textAlign: "right" }}>
            <Link href={`/admin/training/${s.id}`} style={{ fontSize: "0.9rem" }}>
              {logged === 0 ? "Log attendance" : "Edit"}
            </Link>
          </td>
        </>
      ),
    };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>TRAINING LOG</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/training/import" className="button outline">Import CSV</Link>
          <ExportCsvButton action={exportTrainingLog} filename="training-log-export.csv" />
        </div>   
      </div>
      <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 24, fontSize: "0.9rem" }}>
        Record attendance for each training session. Sessions come from the schedule.
      </p>

      <SearchableTable
        columns={["Session", "Team", "Date", "Logged", ""]}
        rows={rows}
        placeholder="Search sessions by title or team..."
        emptyMessage="No training sessions found. Add one under Schedule first (type: Training or Drill)."
      />
    </div>
  );
}
