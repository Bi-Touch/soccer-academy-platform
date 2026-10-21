import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { getConsentReviewStatuses } from "@/lib/consentReview";

const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem", verticalAlign: "top" } as const;

export default async function ConsentQueuePage(props: {
  searchParams: Promise<{ show?: string }>;
}) {
  await requireAdmin();
  const search = await props.searchParams;
  const showAll = search.show === "all";

  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      user: { select: { name: true } },
      parentGuardian: { select: { firstName: true, lastName: true, phone: true } },
    },
    orderBy: { name: "asc" },
  });
  const statuses = await getConsentReviewStatuses(players.map((p) => p.id));

  const rows = players.map((p) => ({
    id: p.id,
    name: p.name?.trim() || p.user?.name || "Unnamed player",
    guardian: p.parentGuardian ? `${p.parentGuardian.firstName} ${p.parentGuardian.lastName}` : null,
    phone: p.parentGuardian?.phone ?? null,
    status: statuses.get(p.id),
  }));

  const pending = rows.filter((r) => r.status?.needsReview);
  const shown = showAll ? rows : pending;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>CONSENT</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>
        Players whose consent has not been recorded, or needs confirming again. For families who cannot use the portal,
        print the form, have it signed, then record it here.
      </p>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, fontSize: "0.9rem" }}>
        <Link href="/admin/consent/paper-form" className="button secondary">Print blank paper form</Link>
        <span>
          {pending.length} of {rows.length} need review &middot;{" "}
          <Link href={showAll ? "/admin/consent" : "/admin/consent?show=all"} style={{ textDecoration: "underline" }}>
            {showAll ? "Show only those needing review" : "Show all players"}
          </Link>
        </span>
      </div>

      {shown.length === 0 ? (
        <p style={{ opacity: 0.7 }}>{showAll ? "No players yet." : "Every player's consent is up to date."}</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                <th style={cellStyle}>Player</th>
                <th style={cellStyle}>Guardian</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle} />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td style={cellStyle}>{r.name}</td>
                  <td style={cellStyle}>
                    {r.guardian ?? <span style={{ opacity: 0.6 }}>No guardian linked</span>}
                    {r.phone && <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{r.phone}</div>}
                  </td>
                  <td style={cellStyle}>
                    {r.status?.needsReview ? (
                      <span style={{ color: "var(--card-red)" }}>{r.status.reasons[0]}</span>
                    ) : (
                      <span style={{ color: "var(--pitch)" }}>Up to date</span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <Link href={`/admin/consent/${r.id}`} style={{ textDecoration: "underline", color: "var(--pitch)" }}>
                      Record paper form
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
