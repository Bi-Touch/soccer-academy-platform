import type { RegistrationFormData } from "@/lib/registrationTypes";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.9rem", borderBottom: "1px solid #f0ede5" }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

function Tick({ ok }: { ok: boolean }) {
  return <span style={{ color: ok ? "var(--pitch)" : "var(--card-red)" }}>{ok ? "✓" : "✗"}</span>;
}

export function ReviewStep({
  data,
  onBack,
  onSubmit,
  submitting,
}: {
  data: RegistrationFormData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>
        Review &amp; Submit
      </h2>

      <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>GUARDIAN</h3>
      <Row label="Name" value={`${data.guardianFirstName} ${data.guardianLastName}`} />
      <Row label="Relationship" value={data.guardianRelationship} />
      <Row label="Phone" value={data.guardianPhone} />
      <Row label="Email" value={data.guardianEmail} />

      <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginTop: 20, marginBottom: 4 }}>PLAYER</h3>
      <Row label="Name" value={`${data.playerFirstName} ${data.playerLastName}`} />
      <Row label="Date of birth" value={data.playerDateOfBirth} />
      <Row label="Position" value={data.position} />

      <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginTop: 20, marginBottom: 4 }}>CONSENT</h3>
      <Row label="Academy data processing" value={<Tick ok={data.dataProcessing} />} />
      <Row label="Training statistics" value={<Tick ok={data.statistics} />} />
      <Row label="Photography" value={<Tick ok={data.photography} />} />
      <Row label="Video" value={<Tick ok={data.videoRecording} />} />
      <Row label="Public media" value={<Tick ok={data.publicMedia} />} />
      <Row label="Local scouting" value={<Tick ok={data.localScouting} />} />
      <Row label="Overseas academies" value={<Tick ok={data.overseasAcademies} />} />
      <Row label="Overseas clubs" value={<Tick ok={data.overseasClubs} />} />
      <Row label="Scouts" value={<Tick ok={data.scouts} />} />
      <Row label="Agents" value={<Tick ok={data.agents} />} />

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack} disabled={submitting}>Back</button>
        <button type="button" className="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Registration"}
        </button>
      </div>
    </section>
  );
}