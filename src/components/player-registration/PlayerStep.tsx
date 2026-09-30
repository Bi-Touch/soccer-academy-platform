import type { RegistrationFormData } from "@/lib/registrationTypes";
import { POSITIONS } from "@/lib/positions";

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
const labelStyle = { fontSize: "0.85rem" };

export function PlayerStep({
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
  const canContinue = data.playerFirstName && data.playerLastName && data.playerDateOfBirth;

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>
        Player Information
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          First name *
          <input style={inputStyle} value={data.playerFirstName} onChange={(e) => update({ playerFirstName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Last name *
          <input style={inputStyle} value={data.playerLastName} onChange={(e) => update({ playerLastName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Date of birth *
          <input type="date" style={inputStyle} value={data.playerDateOfBirth} onChange={(e) => update({ playerDateOfBirth: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Gender
          <select style={inputStyle} value={data.gender} onChange={(e) => update({ gender: e.target.value })}>
            <option value="">Not set</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </label>
        <label style={labelStyle}>
          Nationality
          <input style={inputStyle} value={data.nationality} onChange={(e) => update({ nationality: e.target.value })} />
        </label>
        <label style={labelStyle}>
          Position
          <select style={inputStyle} value={data.position} onChange={(e) => update({ position: e.target.value })}>
            <option value="">Select a position</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Preferred foot
          <select style={inputStyle} value={data.preferredFoot} onChange={(e) => update({ preferredFoot: e.target.value })}>
            <option value="">Not set</option>
            <option value="LEFT">Left</option>
            <option value="RIGHT">Right</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label style={labelStyle}>
          Previous club
          <input style={inputStyle} value={data.previousClub} onChange={(e) => update({ previousClub: e.target.value })} />
        </label>
        <label style={labelStyle}>
          Previous academy
          <input style={inputStyle} value={data.previousAcademy} onChange={(e) => update({ previousAcademy: e.target.value })} />
        </label>
      </div>

      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginTop: 24, marginBottom: 12 }}>
        Emergency / Medical
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          Emergency contact name
          <input style={inputStyle} value={data.emergencyName} onChange={(e) => update({ emergencyName: e.target.value })} />
        </label>
        <label style={labelStyle}>
          Emergency contact phone
          <input style={inputStyle} value={data.emergencyPhone} onChange={(e) => update({ emergencyPhone: e.target.value })} />
        </label>
      </div>
      <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
        Medical notes (allergies, conditions, etc.)
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={data.medicalNotes} onChange={(e) => update({ medicalNotes: e.target.value })} />
      </label>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack}>Back</button>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}