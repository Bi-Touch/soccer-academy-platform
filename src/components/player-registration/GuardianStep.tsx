import type { RegistrationFormData } from "@/lib/registrationTypes";

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
const labelStyle = { fontSize: "0.85rem" };

export function GuardianStep({
  data,
  update,
  onNext,
}: {
  data: RegistrationFormData;
  update: (patch: Partial<RegistrationFormData>) => void;
  onNext: () => void;
}) {
  const canContinue = data.guardianFirstName && data.guardianLastName && data.guardianRelationship && data.guardianPhone && data.guardianEmail;

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 16 }}>
        Parent / Guardian Information
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          First name *
          <input style={inputStyle} value={data.guardianFirstName} onChange={(e) => update({ guardianFirstName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Last name *
          <input style={inputStyle} value={data.guardianLastName} onChange={(e) => update({ guardianLastName: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Relationship to player *
          <input style={inputStyle} placeholder="e.g. Mother, Father, Guardian" value={data.guardianRelationship} onChange={(e) => update({ guardianRelationship: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Phone number *
          <input style={inputStyle} value={data.guardianPhone} onChange={(e) => update({ guardianPhone: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          Email address *
          <input type="email" style={inputStyle} value={data.guardianEmail} onChange={(e) => update({ guardianEmail: e.target.value })} required />
        </label>
        <label style={labelStyle}>
          ID / Passport number
          <input style={inputStyle} value={data.guardianIdNumber} onChange={(e) => update({ guardianIdNumber: e.target.value })} />
        </label>
      </div>
      <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
        Address
        <input style={inputStyle} value={data.guardianAddress} onChange={(e) => update({ guardianAddress: e.target.value })} />
      </label>

      <div style={{ marginTop: 24 }}>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}