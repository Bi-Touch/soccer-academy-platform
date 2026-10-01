import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "#fdf3e2", fg: "var(--floodlight)" },
  UNDER_REVIEW: { bg: "#fdf3e2", fg: "var(--floodlight)" },
  CHANGES_REQUESTED: { bg: "#fdecec", fg: "var(--card-red)" },
  APPROVED: { bg: "#e7f3ed", fg: "var(--pitch)" },
  REJECTED: { bg: "#fdecec", fg: "var(--card-red)" },
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_PILL[status] ?? { bg: "#eee", fg: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        background: style.bg,
        color: style.fg,
        fontWeight: 600,
        fontSize: "0.8rem",
        padding: "4px 12px",
        borderRadius: 999,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

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
                <td><StatusPill status={r.status} /></td>
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