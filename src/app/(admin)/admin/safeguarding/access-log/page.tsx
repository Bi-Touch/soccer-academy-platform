import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSafeguardingLead } from "@/lib/permissions";
import { concernRef } from "@/lib/safeguarding";

const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.85rem", verticalAlign: "top" } as const;

const ACTION_LABELS: Record<string, string> = {
  "safeguarding.raise": "Concern raised",
  "safeguarding.view": "Record opened",
  "safeguarding.update": "Record updated",
};

/**
 * Who has raised, opened or updated safeguarding records, and why. Only safeguarding leads see
 * this. Ask your administrator to hide "safeguarding." actions from the general audit log, so
 * the details stay within this group.
 */
export default async function SafeguardingAccessLogPage() {
  const lead = await requireSafeguardingLead().catch(() => null);
  if (!lead) notFound();

  const entries = await prisma.auditLog.findMany({
    where: { action: { startsWith: "safeguarding." } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, createdAt: true, actorName: true, actorRole: true, action: true, entityId: true, reason: true },
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/admin/safeguarding" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Safeguarding</Link>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", margin: "12px 0 8px" }}>ACCESS LOG</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>The latest 200 entries. This log records who did what and why, never what a record says.</p>

      {entries.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Nothing recorded yet.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                <th style={cellStyle}>When</th>
                <th style={cellStyle}>Who</th>
                <th style={cellStyle}>What</th>
                <th style={cellStyle}>Record</th>
                <th style={cellStyle}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={cellStyle}>{e.createdAt.toLocaleString("en-GB")}</td>
                  <td style={cellStyle}>{e.actorName ?? "Unknown"}<div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{e.actorRole}</div></td>
                  <td style={cellStyle}>{ACTION_LABELS[e.action] ?? e.action}</td>
                  <td style={cellStyle}>{e.entityId ? concernRef(e.entityId) : "—"}</td>
                  <td style={cellStyle}>{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
