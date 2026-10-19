import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { readFlashPassword } from "@/lib/flashPassword";
import { StatusPill } from "@/components/StatusPill";
import { SearchableTable } from "@/components/SearchableTable";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export default async function AdminRegistrationsPage() {
  await requireAdmin();

  const registrations = await prisma.playerRegistration.findMany({
    include: { parentGuardian: true },
    orderBy: { createdAt: "desc" },
  });

  // The password arrives in a short-lived httpOnly cookie set by resetGuardianPassword, not in the URL.
  // A cookie with a registrationId belongs to an approval and is shown on that registration's page instead.
  const flash = await readFlashPassword();
  const reset = flash && flash.email && !flash.registrationId ? flash : null;

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

      <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 16, margin: "16px 0" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
            Public registration link — share this with parents
        </p>
       <CopyLinkButton path="/register/player" />
      </div>

      {reset && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 20, margin: "16px 0" }}>
          <p style={{ fontWeight: 600, color: "var(--pitch)" }}>Password reset</p>
          <p style={{ fontSize: "0.9rem" }}><strong>Email:</strong> {reset.email}</p>
          <p style={{ fontSize: "0.9rem" }}><strong>Password:</strong> {reset.password}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 8 }}>
            Not stored anywhere and only kept for about two minutes. Copy it now.
          </p>
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
