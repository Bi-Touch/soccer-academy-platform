import type { ReactNode } from "react";
import type { RegistrationFormData } from "@/lib/registrationTypes";

function Check({
  label,
  description,
  checked,
  onChange,
  required,
}: {
  label: ReactNode;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "8px 0" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-required={required || undefined}
        style={{ marginTop: 3 }}
      />
      <span>
        {label}
        {required && <span style={{ color: "var(--card-red)" }} aria-hidden="true"> *</span>}
        {description && (
          <span style={{ display: "block", fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>{description}</span>
        )}
      </span>
    </label>
  );
}

function Group({
  title,
  intro,
  boxed,
  children,
}: {
  title: string;
  intro?: string;
  boxed?: boolean;
  children: ReactNode;
}) {
  const wrapperStyle = boxed
    ? { background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 16 }
    : { marginBottom: 16 };

  return (
    <div style={wrapperStyle}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <legend style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", padding: 0, marginBottom: 4 }}>
          {title}
        </legend>
        {intro && <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: "0 0 4px" }}>{intro}</p>}
        {children}
      </fieldset>
    </div>
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
  // Health consent is only mandatory when the parent has entered medical notes.
  const healthRequired = data.medicalNotes.trim().length > 0;

  const canContinue =
    data.dataProcessing &&
    data.statistics &&
    data.emergencyTreatmentAuthorised &&
    data.guardianDeclaration &&
    (!healthRequired || data.healthData);

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
        Consent &amp; Privacy
      </h2>
      <p style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: 16 }}>
        Items marked * are needed to register. Everything else is optional, and you can withdraw any optional consent at any time by contacting the Academy.
      </p>

      <Group title="Required" boxed>
        <Check
          required
          label="I understand that the Academy will collect and use the player's personal information to run registration, training and matches, to keep players safe (including safeguarding) and to support their development, as explained in the Privacy Policy."
          checked={data.dataProcessing}
          onChange={(v) => update({ dataProcessing: v })}
        />
        <Check
          required
          label="I understand that training and match statistics will be recorded and used for coaching and player development."
          checked={data.statistics}
          onChange={(v) => update({ statistics: v })}
        />
        <Check
          required
          label="If I cannot be reached in an emergency, I authorise Academy staff to arrange urgent medical treatment for the player."
          checked={data.emergencyTreatmentAuthorised}
          onChange={(v) => update({ emergencyTreatmentAuthorised: v })}
        />
      </Group>

      <Group title="Health information">
        <Check
          required={healthRequired}
          label="I consent to the Academy recording the player's health information (such as allergies, conditions and injuries) and sharing it with coaches and medical staff only as needed to keep the player safe."
          description={
            healthRequired
              ? "You entered medical notes, so this consent is needed to store them."
              : "You can leave this unticked if you have not provided any medical information."
          }
          checked={data.healthData}
          onChange={(v) => update({ healthData: v })}
        />
      </Group>

      <Group title="Photos and video">
        <Check
          label="Photography during Academy activities"
          description="Photos are used for coaching and Academy records unless you also allow public use below."
          checked={data.photography}
          onChange={(v) => update({ photography: v })}
        />
        <Check
          label="Training and match video recording"
          description="Video is used for coaching and analysis unless you also allow public use below."
          checked={data.videoRecording}
          onChange={(v) => update({ videoRecording: v })}
        />
        <Check
          label="Public use of photos and videos on the Academy website and social media"
          description="Only applies to photos and videos you have allowed above."
          checked={data.publicMedia}
          onChange={(v) => update({ publicMedia: v })}
        />
      </Group>

      <Group
        title="Football development and scouting: Kenya"
        intro="Shared information may include the player's name, age, position and statistics, and photos or videos only where you have allowed them above. Sharing does not guarantee trials, contracts or transfers."
      >
        <Check
          label="Share information with local (Kenyan) academies, clubs and scouts"
          checked={data.localScouting}
          onChange={(v) => update({ localScouting: v })}
        />
        <Check
          label="Share information with local (Kenyan) football agents or intermediaries"
          checked={data.localAgents}
          onChange={(v) => update({ localAgents: v })}
        />
      </Group>

      <Group
        title="Football development and scouting: overseas"
        intro="Overseas sharing means the information may be sent outside Kenya, where data protection rules may differ. Choose only the recipients you are comfortable with."
      >
        <Check
          label="Share information with overseas academies"
          checked={data.overseasAcademies}
          onChange={(v) => update({ overseasAcademies: v })}
        />
        <Check
          label="Share information with overseas clubs"
          checked={data.overseasClubs}
          onChange={(v) => update({ overseasClubs: v })}
        />
        <Check
          label="Share information with overseas scouts and talent identification organisations"
          checked={data.overseasScouts}
          onChange={(v) => update({ overseasScouts: v })}
        />
        <Check
          label="Share information with overseas football agents or intermediaries"
          checked={data.overseasAgents}
          onChange={(v) => update({ overseasAgents: v })}
        />
      </Group>

      <Group title="Communications">
        <Check
          label="Send me Academy news and promotional updates"
          description="This is separate from essential messages about training, matches and safety, which you will always receive."
          checked={data.marketingCommunications}
          onChange={(v) => update({ marketingCommunications: v })}
        />
      </Group>

      <div style={{ borderTop: "1px solid #e3ded2", paddingTop: 16 }}>
        <Check
          required
          label={
            <>
              I confirm that I am the player&apos;s parent or legal guardian with authority to give these consents, and I have read and understood the{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pitch)", textDecoration: "underline" }}>
                Privacy Policy
              </a>
              .
            </>
          }
          checked={data.guardianDeclaration}
          onChange={(v) => update({ guardianDeclaration: v })}
        />
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button type="button" className="button secondary" onClick={onBack}>Back</button>
        <button type="button" className="button" disabled={!canContinue} onClick={onNext}>Continue</button>
      </div>
    </section>
  );
}