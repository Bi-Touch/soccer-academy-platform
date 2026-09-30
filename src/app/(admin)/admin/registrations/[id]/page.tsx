import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { approveRegistration, rejectRegistration, requestChanges } from "../actions";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 };

export default async function RegistrationDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const registration = await prisma.playerRegistration.findUnique({
    where: { id: params.id },
    include: { parentGuardian: true, consent: true },
  });
  if (!registration) return notFound();

  const approveWithId = approveRegistration.bind(null, registration.id);
  const rejectWithId = rejectRegistration.bind(null, registration.id);
  const requestChangesWithId = requestChanges.bind(null, registration.id);
  const g = registration.parentGuardian;
  const c = registration.consent;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/admin/registrations" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All registrations</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 4 }}>
        {registration.firstName.toUpperCase()} {registration.lastName.toUpperCase()}
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>Status: {registration.status.replace("_", " ")}</p>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>GUARDIAN</h2>
        <p>{g.firstName} {g.lastName} — {g.relationship}</p>
        <p style={{ opacity: 0.75, fontSize: "0.9rem" }}>{g.phone} &middot; {g.email}</p>
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