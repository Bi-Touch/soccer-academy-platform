import Link from "next/link";
import { notFound } from "next/navigation";
import type { ClearanceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireClearanceViewer } from "@/lib/permissions";
import { formatDate } from "@/lib/dates";
import {
  ALL_CLEARANCES,
  CLEARANCE_LABELS,
  REQUIRED_CLEARANCES,
  clearanceState,
  type ClearanceState,
} from "@/lib/safeguarding";
import { saveClearance } from "../actions";

const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.85rem", verticalAlign: "top" } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem" } as const;

const ERRORS: Record<string, string> = {
  type: "Choose what is being recorded.",
  date: "Enter the date it was issued. It cannot be in the future.",
  expiry: "The expiry date must be after the issue date.",
  person: "Choose a member of staff.",
};

const STATE_STYLE: Record<ClearanceState, { color: string; label: string }> = {
  valid: { color: "var(--pitch)", label: "Valid" },
  expiring: { color: "#b45309", label: "Expiring" },
  expired: { color: "var(--card-red)", label: "Expired" },
  missing: { color: "var(--card-red)", label: "Missing" },
};

/**
 * Who has the vetting and training needed to work with players. The safeguarding lead can record
 * items; admins can view. Nothing here is automatic: squad assignment is not blocked by it yet.
 */
export default async function ClearancesPage(props: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const viewer = await requireClearanceViewer().catch(() => null);
  if (!viewer) notFound();
  const canEdit = viewer.role === "SAFEGUARDING_LEAD";
  const search = await props.searchParams;

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COACH", "MEDICAL_OFFICER", "SAFEGUARDING_LEAD"] } },
    select: {
      id: true,
      name: true,
      role: true,
      staffClearances: {
        select: { type: true, issuedAt: true, expiresAt: true },
        orderBy: { issuedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = staff.map((person) => {
    const latest = new Map<ClearanceType, { expiresAt: Date | null; issuedAt: Date }>();
    for (const record of person.staffClearances) {
      if (!latest.has(record.type)) latest.set(record.type, record); // newest first
    }
    const states = new Map(ALL_CLEARANCES.map((type) => [type, clearanceState(latest.get(type))]));
    const compliant = REQUIRED_CLEARANCES.every((type) => {
      const s = states.get(type);
      return s === "valid" || s === "expiring";
    });
    return { person, latest, states, compliant };
  });

  const notCompliant = rows.filter((r) => !r.compliant).length;

  return (
    <div style={{ maxWidth: 1000 }}>
      <Link href={canEdit ? "/admin/safeguarding" : "/admin"} style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Back</Link>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", margin: "12px 0 8px" }}>STAFF CLEARANCES</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>
        Everyone who works with players needs a certificate of good conduct, safeguarding training and a signed code of conduct.
        {" "}{notCompliant === 0 ? "Everyone is currently covered." : `${notCompliant} of ${rows.length} people are missing a required item or have one that has expired.`}
        {!canEdit && " You can view this page; only the safeguarding lead can record items."}
      </p>

      {search.saved === "1" && (
        <div role="status" style={{ background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>Saved.</div>
      )}
      {search.error && ERRORS[search.error] && (
        <div role="alert" style={{ background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>{ERRORS[search.error]}</div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 800 }}>
          <thead>
            <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
              <th style={cellStyle}>Staff member</th>
              {ALL_CLEARANCES.map((type) => (
                <th key={type} style={cellStyle}>{CLEARANCE_LABELS[type]}{REQUIRED_CLEARANCES.includes(type) ? " *" : ""}</th>
              ))}
              <th style={cellStyle}>Cleared</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ person, latest, states, compliant }) => (
              <tr key={person.id}>
                <td style={cellStyle}>{person.name}<div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{person.role.replace("_", " ").toLowerCase()}</div></td>
                {ALL_CLEARANCES.map((type) => {
                  const state = states.get(type) as ClearanceState;
                  const record = latest.get(type);
                  const required = REQUIRED_CLEARANCES.includes(type);
                  if (state === "missing" && !required) return <td key={type} style={{ ...cellStyle, opacity: 0.4 }}>—</td>;
                  return (
                    <td key={type} style={cellStyle}>
                      <span style={{ color: STATE_STYLE[state].color, fontWeight: 600 }}>{STATE_STYLE[state].label}</span>
                      {record?.expiresAt && <div style={{ fontSize: "0.75rem", opacity: 0.65 }}>until {formatDate(record.expiresAt)}</div>}
                    </td>
                  );
                })}
                <td style={cellStyle}><span style={{ color: compliant ? "var(--pitch)" : "var(--card-red)", fontWeight: 600 }}>{compliant ? "✓ Yes" : "✗ No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <form action={saveClearance} style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20 }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>RECORD A CLEARANCE</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={labelStyle}>
              Staff member *
              <select name="userId" required defaultValue="" style={inputStyle}>
                <option value="" disabled>Choose</option>
                {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              What is being recorded *
              <select name="type" required defaultValue="" style={inputStyle}>
                <option value="" disabled>Choose</option>
                {ALL_CLEARANCES.map((type) => <option key={type} value={type}>{CLEARANCE_LABELS[type]}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Issued on *
              <input type="date" name="issuedOn" required max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Expires on (if it expires)
              <input type="date" name="expiresOn" style={inputStyle} />
            </label>
          </div>
          <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
            Where the original is filed
            <input name="documentRef" maxLength={200} placeholder="e.g. Staff folder 4, tab 2" style={inputStyle} />
          </label>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "12px 0" }}>
            Record the date and where the original is kept, not a copy of the document. Older records stay as history.
          </p>
          <button type="submit" className="button">Save</button>
        </form>
      )}
    </div>
  );
}
