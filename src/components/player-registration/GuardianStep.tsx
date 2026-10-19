import { GUARDIAN_RELATIONSHIPS, type RegistrationFormData } from "@/lib/registrationTypes";

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
  const canContinue =
    data.guardianFirstName.trim() &&
    data.guardianLastName.trim() &&
    data.guardianRelationship &&
    data.guardianPhone.trim() &&
    data.guardianEmail.trim();

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
        Parent / Guardian Information
      </h2>
      <p style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: 16 }}>
        We use these details to contact you about your child&apos;s training, matches and safety.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          First name *
          <input
            style={inputStyle}
            autoComplete="given-name"
            maxLength={100}
            value={data.guardianFirstName}
            onChange={(e) => update({ guardianFirstName: e.target.value })}
            required
          />
        </label>
        <label style={labelStyle}>
          Last name *
          <input
            style={inputStyle}
            autoComplete="family-name"
            maxLength={100}
            value={data.guardianLastName}
            onChange={(e) => update({ guardianLastName: e.target.value })}
            required
          />
        </label>
        <label style={labelStyle}>
          Relationship to player *
          <select
            style={inputStyle}
            value={data.guardianRelationship}
            onChange={(e) => update({ guardianRelationship: e.target.value })}
            required
          >
            <option value="">Select</option>
            {GUARDIAN_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Phone number *
          <input
            type="tel"
            style={inputStyle}
            autoComplete="tel"
            maxLength={30}
            value={data.guardianPhone}
            onChange={(e) => update({ guardianPhone: e.target.value })}
            required
          />
        </label>
        <label style={labelStyle}>
          Email address *
          <input
            type="email"
            style={inputStyle}
            autoComplete="email"
            maxLength={254}
            value={data.guardianEmail}
            onChange={(e) => update({ guardianEmail: e.target.value })}
            required
          />
        </label>
      </div>
      <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
        Address
        <input
          style={inputStyle}
          autoComplete="street-address"
          maxLength={300}
          value={data.guardianAddress}
          onChange={(e) => update({ guardianAddress: e.target.value })}
        />
      </label>

      <div style={{ marginTop: 24 }}>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}