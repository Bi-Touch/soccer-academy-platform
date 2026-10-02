import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { StatusPill } from "@/components/StatusPill";
import { SearchableTable } from "@/components/SearchableTable";

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: { resetGuardianEmail?: string; tempPassword?: string };
}) {
  await requireAdmin();

  const registrations = await prisma.playerRegistration.findMany({
    include: { parentGuardian: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations.map((r) => ({
    id: r.id,
    label: `${r.firstName} ${r.lastName} ${r.parentGuardian.firstName} ${r.parentGuardian.lastName} ${r.status}`,
    node: (
      <>
        <td style={{ padding: "10px 16px" }}>{r.firstName} {r.lastName}</td>
        <td style={{ padding: "10px 16px" }}>{r.parentGuardian.firstName} {r.parentGuardian.lastName}</td>
        <td style={{ padding: "10px 16px" }}>{r.createdAt.toLocaleDateString()}</td>
        <td style={{ padding: "10px 16px" }}><StatusPill status={r.status} /></td>
        <td style={{ padding: "10px 16px", textAlign: "right" }}>
          <Link href={`/admin/registrations/${r.id}`} style={{ fontSize: "0.9rem" }}>View</Link>
        </td>
      </>
    ),
  }));

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>PLAYER REGISTRATIONS</h1>

      {searchParams.tempPassword && searchParams.resetGuardianEmail && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 20, margin: "16px 0" }}>
          <p style={{ fontWeight: 600, color: "var(--pitch)" }}>Password reset</p>
          <p style={{ fontSize: "0.9rem" }}><strong>Email:</strong> {searchParams.resetGuardianEmail}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>Password:</strong> {searchParams.tempPassword}</p>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <SearchableTable
          columns={["Player", "Guardian", "Submitted", "Status", ""]}
          rows={rows}
          placeholder="Search registrations by player, guardian, or status..."
          emptyMessage="No registrations yet."
        />
      </div>
    </div>
  );
}