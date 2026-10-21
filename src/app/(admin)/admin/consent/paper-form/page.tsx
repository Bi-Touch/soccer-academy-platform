import { requireAdmin } from "@/lib/permissions";
import { CONSENT_GROUPS } from "@/lib/consentLedger";
import { REQUIRED_STATEMENTS } from "@/lib/consentText";
import { CONSENT_FORM_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/privacyVersions";
import { PrintButton } from "@/components/PrintButton";

const line = { display: "inline-block", borderBottom: "1px solid #000", minWidth: 220, height: "1.1em" } as const;

/**
 * A printable blank consent form. It is generated from the same wording and the same list
 * of consent items as the portal, and prints its version numbers, so a signed copy can be
 * matched to the right wording when it is recorded.
 */
export default async function PaperFormPage() {
  await requireAdmin();

  return (
    <div className="paper-form" style={{ maxWidth: 760 }}>
      <style>{`
        .paper-form h1 { font-size: 1.6rem; margin: 0 0 4px; }
        .paper-form h2 { font-size: 1rem; margin: 20px 0 6px; }
        .paper-form p, .paper-form li { font-size: 0.9rem; line-height: 1.5; }
        .paper-form .item { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid #ddd; font-size: 0.9rem; }
        .paper-form .box { white-space: nowrap; }
        @media print {
          .admin-sidebar, .admin-header, .nav-toggle-label, .no-print { display: none !important; }
          .admin-content-shell, .admin-main { margin: 0 !important; padding: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <PrintButton />
        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: 8 }}>
          Print one copy per player. Each copy shows the form version, which must be entered when you record it.
        </p>
      </div>

      <h1>Player Consent Form</h1>
      <p>
        Form version {CONSENT_FORM_VERSION} &middot; Privacy Policy {PRIVACY_POLICY_VERSION}
      </p>

      <h2>Player</h2>
      <p>Full name: <span style={line} /> &nbsp; Date of birth: <span style={{ ...line, minWidth: 140 }} /></p>

      <h2>Parent or guardian</h2>
      <p>Full name: <span style={line} /> &nbsp; Relationship: <span style={{ ...line, minWidth: 140 }} /></p>
      <p>Phone: <span style={line} /></p>

      <h2>Required</h2>
      <p>Please tick every box.</p>
      {Object.values(REQUIRED_STATEMENTS).map((statement) => (
        <div key={statement} className="item">
          <span>{statement}</span>
          <span className="box">&#9744; I agree</span>
        </div>
      ))}

      <h2>Your choices</h2>
      <p>These are optional. Please tick Yes or No for each. You can change or withdraw any of them at any time by contacting the Academy.</p>
      {CONSENT_GROUPS.map((group) => (
        <div key={group.title}>
          <h2>{group.title}</h2>
          {group.intro && <p>{group.intro}</p>}
          {group.items.map((item) => (
            <div key={item.type} className="item">
              <span>
                {item.label}
                {item.description && <span style={{ display: "block", fontSize: "0.8rem", opacity: 0.7 }}>{item.description}</span>}
              </span>
              <span className="box">&#9744; Yes &nbsp; &#9744; No</span>
            </div>
          ))}
        </div>
      ))}

      <h2>Signature</h2>
      <p>Signature: <span style={line} /> &nbsp; Date: <span style={{ ...line, minWidth: 140 }} /></p>
      <p>Printed name: <span style={line} /></p>
    </div>
  );
}
