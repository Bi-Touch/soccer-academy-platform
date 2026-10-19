import type { ReactNode } from "react";
import type { RegistrationFormData } from "@/lib/registrationTypes";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "6px 0", fontSize: "0.9rem", borderBottom: "1px solid #f0ede5" }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

// Text as well as a symbol, so the answer is clear without relying on colour.
function YesNo({ ok }: { ok: boolean }) {
  return (
    <span style={{ color: ok ? "var(--pitch)" : "var(--card-red)" }}>
      {ok ? "✓ Yes" : "✗ No"}
    </span>
  );
}

function SectionHeader({
  title,
  onEdit,
  first,
}: {
  title: string;
  onEdit: () => void;
  first?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: first ? 0 : 20, marginBottom: 4 }}>
      <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", margin: 0 }}>{title}</h3>
      <button
        type="button"
        onClick={onEdit}
        style={{ background: "none", border: 0, padding: 0, color: "var(--pitch)", textDecoration: "underline", cursor: "pointer", fontSize: "0.8rem" }}
      >
        Edit
      </button>
    </div>
  );
}

export function ReviewStep({
  data,
  onBack,
  onEdit,
  onSubmit,
  submitting,
}: {
  data: RegistrationFormData;
  onBack: () => void;
  /** Jump back to a step: 0 Guardian, 1 Player, 2 Consent. */
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const emergencyContact = [
    data.emergencyName,
    data.emergencyRelationship && `(${data.emergencyRelationship})`,
    data.emergencyPhone,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>
        Review &amp; Submit
      </h2>

      <SectionHeader first title="GUARDIAN" onEdit={() => onEdit(0)} />
      <Row label="Name" value={`${data.guardianFirstName} ${data.guardianLastName}`} />
      <Row label="Relationship" value={data.guardianRelationship} />
      <Row label="Phone" value={data.guardianPhone} />
      <Row label="Email" value={data.guardianEmail} />
      <Row label="Address" value={data.guardianAddress} />

      <SectionHeader title="PLAYER" onEdit={() => onEdit(1)} />
      <Row label="Name" value={`${data.playerFirstName} ${data.playerLastName}`} />
      <Row label="Date of birth" value={data.playerDateOfBirth} />
      <Row label="Position" value={data.position} />
      <Row label="Emergency contact" value={emergencyContact} />
      <Row label="Medical information" value={data.medicalNotes.trim() ? "Provided" : "None"} />

      <SectionHeader title="CONSENT" onEdit={() => onEdit(2)} />
      <Row label="Use of information understood" value={<YesNo ok={data.dataProcessing} />} />
      <Row label="Statistics understood" value={<YesNo ok={data.statistics} />} />
      <Row label="Emergency treatment authorised" value={<YesNo ok={data.emergencyTreatmentAuthorised} />} />
      <Row label="Health information" value={<YesNo ok={data.healthData} />} />
      <Row label="Photography" value={<YesNo ok={data.photography} />} />
      <Row label="Video" value={<YesNo ok={data.videoRecording} />} />
      <Row label="Public photos and videos" value={<YesNo ok={data.publicMedia} />} />
      <Row label="Local academies, clubs and scouts" value={<YesNo ok={data.localScouting} />} />
      <Row label="Local agents" value={<YesNo ok={data.localAgents} />} />
      <Row label="Overseas academies" value={<YesNo ok={data.overseasAcademies} />} />
      <Row label="Overseas clubs" value={<YesNo ok={data.overseasClubs} />} />
      <Row label="Overseas scouts" value={<YesNo ok={data.overseasScouts} />} />
      <Row label="Overseas agents" value={<YesNo ok={data.overseasAgents} />} />
      <Row label="News and promotions" value={<YesNo ok={data.marketingCommunications} />} />

      <p style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 16 }}>
        The Academy reviews every registration before an account is created. You can change or withdraw any optional consent at any time by contacting the Academy.
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack} disabled={submitting}>Back</button>
        <button type="button" className="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Registration"}
        </button>
      </div>
    </section>
  );
}