import { ageInYears, type RegistrationFormData } from "@/lib/registrationTypes";
import { POSITIONS } from "@/lib/positions";

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
const labelStyle = { fontSize: "0.85rem" };
const noticeStyle = {
  background: "#fdecec",
  border: "1px solid var(--card-red)",
  borderRadius: 8,
  padding: 12,
  marginTop: 12,
  color: "var(--card-red)",
  fontSize: "0.85rem",
};

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
  const age = ageInYears(data.playerDateOfBirth);
  const futureDob = age !== null && age < 0;
  const adult = age !== null && age >= 18;
  const today = new Date().toISOString().slice(0, 10);

  const canContinue =
    data.playerFirstName.trim() &&
    data.playerLastName.trim() &&
    age !== null &&
    age >= 0 &&
    age < 18 &&
    data.emergencyName.trim() &&
    data.emergencyPhone.trim() &&
    data.emergencyRelationship.trim();

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>
        Player Information
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          First name *
          <input style={inputStyle} maxLength={100} value={data.playerFirstName} onChange={(e) => update({ playerFirstName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Last name *
          <input style={inputStyle} maxLength={100} value={data.playerLastName} onChange={(e) => update({ playerLastName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Date of birth *
          <input type="date" max={today} style={inputStyle} value={data.playerDateOfBirth} onChange={(e) => update({ playerDateOfBirth: e.target.value })} required />
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
          <input style={inputStyle} maxLength={100} value={data.nationality} onChange={(e) => update({ nationality: e.target.value })} />
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
          <input style={inputStyle} maxLength={100} value={data.previousClub} onChange={(e) => update({ previousClub: e.target.value })} />
        </label>
        <label style={labelStyle}>
          Previous academy
          <input style={inputStyle} maxLength={100} value={data.previousAcademy} onChange={(e) => update({ previousAcademy: e.target.value })} />
        </label>
      </div>

      {futureDob && (
        <p role="alert" style={noticeStyle}>
          The date of birth cannot be in the future.
        </p>
      )}
      {adult && (
        <p role="alert" style={noticeStyle}>
          Players aged 18 or over register and give their own consent, so a parent or guardian cannot submit this form for them. Please contact the Academy.
        </p>
      )}

      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginTop: 24, marginBottom: 4 }}>
        Emergency Contact *
      </h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0 0 12px" }}>
        Someone we can reach during training or matches. This can be you.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          Name *
          <input style={inputStyle} maxLength={100} value={data.emergencyName} onChange={(e) => update({ emergencyName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Phone *
          <input type="tel" style={inputStyle} maxLength={30} value={data.emergencyPhone} onChange={(e) => update({ emergencyPhone: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Relationship *
          <input style={inputStyle} maxLength={100} placeholder="e.g. Mother, Aunt" value={data.emergencyRelationship} onChange={(e) => update({ emergencyRelationship: e.target.value })} required />
        </label>
      </div>

      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginTop: 24, marginBottom: 4 }}>
        Medical Information
      </h3>
      <label style={{ ...labelStyle, display: "block" }}>
        Allergies, medical conditions and medication (optional)
        <textarea
          style={{ ...inputStyle, resize: "vertical" }}
          rows={3}
          maxLength={2000}
          value={data.medicalNotes}
          onChange={(e) => update({ medicalNotes: e.target.value })}
        />
      </label>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "6px 0 0" }}>
        Only include what the coaches need to keep your child safe. If you add anything here, you will be asked to consent to the Academy storing it on the next step.
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack}>Back</button>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}