import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--floodlight)",
  UNDER_REVIEW: "var(--floodlight)",
  CHANGES_REQUESTED: "var(--card-red)",
  APPROVED: "var(--pitch)",
  REJECTED: "var(--card-red)",
};

export default async function AdminRegistrationsPage() {
  await requireAdmin();

  const registrations = await prisma.playerRegistration.findMany({
    include: { parentGuardian: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>PLAYER REGISTRATIONS</h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
              <th style={{ padding: "8px 0" }}>Player</th>
              <th>Guardian</th>
              <th>Submitted</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                <td style={{ padding: "10px 0" }}>{r.firstName} {r.lastName}</td>
                <td>{r.parentGuardian.firstName} {r.parentGuardian.lastName}</td>
                <td>{r.createdAt.toLocaleDateString()}</td>
                <td>
                  <span style={{ color: STATUS_COLORS[r.status], fontWeight: 600, fontSize: "0.85rem" }}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/admin/registrations/${r.id}`} style={{ fontSize: "0.9rem" }}>View</Link>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "24px 0", opacity: 0.7 }}>No registrations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}