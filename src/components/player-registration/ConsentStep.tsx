import type { RegistrationFormData } from "@/lib/registrationTypes";

function Check({
  label,
  checked,
  onChange,
  required,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "8px 0" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required={required} style={{ marginTop: 3 }} />
      <span>{label}{required && <span style={{ color: "var(--card-red)" }}> *</span>}</span>
    </label>
  );
}

export function ConsentStep({
  data,
  update,
  onNext,
  onBack,
}: {
  data: RegistrationFormData;
  update: (patch: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canContinue = data.dataProcessing && data.statistics && data.guardianDeclaration;

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
        Consent &amp; Privacy
      </h2>

      <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>Required — Academy Data Processing</p>
        <Check required label="I consent to the Academy collecting and processing the player's personal information for registration, administration, safeguarding and player development." checked={data.dataProcessing} onChange={(v) => update({ dataProcessing: v })} />
        <Check required label="I consent to training and match statistics being collected and maintained." checked={data.statistics} onChange={(v) => update({ statistics: v })} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>Optional — Media</p>
        <Check label="Photography during Academy activities" checked={data.photography} onChange={(v) => update({ photography: v })} />
        <Check label="Training/match video recording" checked={data.videoRecording} onChange={(v) => update({ videoRecording: v })} />
        <Check label="Use of photos/videos on the Academy website or social media" checked={data.publicMedia} onChange={(v) => update({ publicMedia: v })} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>Optional — Football Development &amp; Scouting</p>
        <Check label="Sharing information with local (Kenyan) academies/clubs/scouts" checked={data.localScouting} onChange={(v) => update({ localScouting: v })} />
        <Check label="Sharing information with overseas academies" checked={data.overseasAcademies} onChange={(v) => update({ overseasAcademies: v })} />
        <Check label="Sharing information with overseas clubs" checked={data.overseasClubs} onChange={(v) => update({ overseasClubs: v })} />
        <Check label="Sharing information with scouts / talent identification organisations" checked={data.scouts} onChange={(v) => update({ scouts: v })} />
        <Check label="Sharing information with football agents / intermediaries" checked={data.agents} onChange={(v) => update({ agents: v })} />
      </div>

      <div style={{ borderTop: "1px solid #e3ded2", paddingTop: 16 }}>
        <Check required label="I confirm that I am the parent/legal guardian of the player being registered, and I have read and understood the Privacy Notice and Consent Form." checked={data.guardianDeclaration} onChange={(v) => update({ guardianDeclaration: v })} />
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack}>Back</button>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}