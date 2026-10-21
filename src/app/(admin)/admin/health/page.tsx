import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff, getAccessibleTeamIds } from "@/lib/permissions";
import { getConsentedPlayerIds } from "@/lib/consentLedger";

const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem", verticalAlign: "top" } as const;

function Mark({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span style={{ opacity: 0.5 }}>—</span>;
  return <span style={{ color: ok ? "var(--pitch)" : "var(--card-red)" }}>{ok ? "✓ Yes" : "✗ No"}</span>;
}

export default async function HealthRecordsPage() {
  // Admins and coaches only. Coaches are limited to the players of their own teams.
  const user = await requireStaff();
  const teamIds = await getAccessibleTeamIds(user);

  const [players, consented] = await Promise.all([
    prisma.player.findMany({
      where: teamIds === null ? {} : { teamId: { in: teamIds } },
      select: {
        id: true,
        name: true,
        user: { select: { name: true } },
        team: { select: { name: true } },
        healthProfile: { select: { emergencyTreatmentAuthorised: true } },
      },
      orderBy: { name: "asc" },
    }),
    getConsentedPlayerIds(["HEALTH_DATA"]),
  ]);

  const isCoach = user.role === "COACH";

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>HEALTH RECORDS</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>
        {isCoach
          ? "You can see the players of your own teams. You will only see what is needed to keep them safe: allergies, emergency treatment authorisation and emergency contacts."
          : "All players. Opening a record is logged."}
      </p>

      {players.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No players to show.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                <th style={cellStyle}>Player</th>
                <th style={cellStyle}>Team</th>
                <th style={cellStyle}>Health consent</th>
                <th style={cellStyle}>Emergency treatment</th>
                <th style={cellStyle} />
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <td style={cellStyle}>{p.name?.trim() || p.user?.name || "Unnamed player"}</td>
                  <td style={cellStyle}>{p.team?.name ?? <span style={{ opacity: 0.6 }}>Unassigned</span>}</td>
                  <td style={cellStyle}><Mark ok={consented.has(p.id)} /></td>
                  <td style={cellStyle}><Mark ok={p.healthProfile ? p.healthProfile.emergencyTreatmentAuthorised : null} /></td>
                  <td style={cellStyle}>
                    <Link href={`/admin/health/${p.id}`} style={{ textDecoration: "underline", color: "var(--pitch)" }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
