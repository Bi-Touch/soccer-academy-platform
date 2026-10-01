import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { approveRegistration, rejectRegistration, requestChanges, resetGuardianPassword } from "../actions";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 };

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

export default async function RegistrationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tempPassword?: string };
}) {
  await requireAdmin();

  const registration = await prisma.playerRegistration.findUnique({
    where: { id: params.id },
    include: { parentGuardian: true, consent: true },
  });
  if (!registration) return notFound();

  const approveWithId = approveRegistration.bind(null, registration.id);
  const rejectWithId = rejectRegistration.bind(null, registration.id);
  const requestChangesWithId = requestChanges.bind(null, registration.id);
  const resetPasswordWithId = resetGuardianPassword.bind(null, registration.parentGuardian.id);
  const g = registration.parentGuardian;
  const c = registration.consent;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/admin/registrations" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All registrations</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        {registration.firstName.toUpperCase()} {registration.lastName.toUpperCase()}
      </h1>
      <div style={{ marginBottom: 24 }}>
        <StatusPill status={registration.status} />
      </div>

      {searchParams.tempPassword && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
            Account created — share these credentials with the guardian
          </p>
          <p style={{ fontSize: "0.9rem", marginBottom: 4 }}><strong>Email:</strong> {g.email}</p>
          <p style={{ fontSize: "0.9rem", marginBottom: 8 }}><strong>Temporary password:</strong> {searchParams.tempPassword}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            This password is shown once and is not stored anywhere — if you navigate away, it cannot be retrieved again.
            Ask the guardian to change it after their first login.
          </p>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>GUARDIAN</h2>
        <p>{g.firstName} {g.lastName} — {g.relationship}</p>
        <p style={{ opacity: 0.75, fontSize: "0.9rem" }}>{g.phone} &middot; {g.email}</p>
        <div style={{ marginTop: 12 }}>
          <form action={resetPasswordWithId}>
            <button type="submit" className="button secondary">Get / Reset Guardian Password</button>
          </form>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>PLAYER</h2>
        <p>DOB: {registration.dateOfBirth.toLocaleDateString()}</p>
        <p>Position: {registration.position || "—"} &middot; Preferred foot: {registration.preferredFoot || "—"}</p>
        {registration.medicalNotes && <p style={{ marginTop: 8, fontSize: "0.9rem" }}>Medical notes: {registration.medicalNotes}</p>}
      </div>

      {c && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>CONSENT</h2>
          {[
            ["Data processing", c.dataProcessing], ["Statistics", c.statistics], ["Photography", c.photography],
            ["Video", c.videoRecording], ["Public media", c.publicMedia], ["Local scouting", c.localScouting],
            ["Overseas academies", c.overseasAcademies], ["Overseas clubs", c.overseasClubs],
            ["Scouts", c.scouts], ["Agents", c.agents],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", padding: "4px 0" }}>
              <span style={{ opacity: 0.75 }}>{label}</span>
              <span style={{ color: val ? "var(--pitch)" : "var(--card-red)" }}>{val ? "✓" : "✗"}</span>
            </div>
          ))}
        </div>
      )}

      {registration.status !== "APPROVED" && registration.status !== "REJECTED" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <form action={approveWithId}>
            <button type="submit" className="button">Approve</button>
          </form>
          <form action={requestChangesWithId} style={{ display: "flex", gap: 8 }}>
            <input name="reviewNotes" placeholder="Notes for changes needed" style={{ flex: 1, padding: 8 }} />
            <button type="submit" className="button secondary">Request Changes</button>
          </form>
          <form action={rejectWithId} style={{ display: "flex", gap: 8 }}>
            <input name="reviewNotes" placeholder="Reason for rejection" style={{ flex: 1, padding: 8 }} />
            <button type="submit" style={{ background: "none", border: "1px solid var(--card-red)", color: "var(--card-red)", padding: "10px 16px", cursor: "pointer" }}>Reject</button>
          </form>
        </div>
      )}
    </div>
  );
}