import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { ageInYears } from "@/lib/registrationTypes";
import { getCurrentConsents } from "@/lib/consentLedger";
import { getConsentReviewStatuses } from "@/lib/consentReview";
import { REQUIRED_STATEMENTS } from "@/lib/consentText";
import { CONSENT_FORM_VERSION } from "@/lib/privacyVersions";
import { ConsentFields } from "@/components/admin/ConsentFields";
import { recordPaperConsent } from "./actions";

const cardStyle = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 } as const;
const noticeStyle = { borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem" } as const;

const ERRORS: Record<string, string> = {
  required: "Tick every required item, and confirm you have seen the signed form.",
  version: `The form version must match the current version (${CONSENT_FORM_VERSION}). A form printed from an older version cannot be recorded here.`,
  date: "Enter the date the form was signed. It must be a real date and not in the future.",
  signer: "This player is under 18 and has no linked guardian, so nobody can give consent. Link a guardian first.",
};

function RequiredCheck({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "6px 0" }}>
      <input type="checkbox" name={name} required style={{ marginTop: 3 }} />
      <span>
        {children}
        <span style={{ color: "var(--card-red)" }} aria-hidden="true"> *</span>
      </span>
    </label>
  );
}

export default async function RecordPaperConsentPage(props: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await props.params;
  const search = await props.searchParams;
  await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: params.playerId },
    select: {
      id: true,
      name: true,
      dateOfBirth: true,
      user: { select: { name: true } },
      parentGuardian: { select: { firstName: true, lastName: true, relationship: true, phone: true } },
    },
  });
  if (!player) return notFound();

  const [current, statuses] = await Promise.all([
    getCurrentConsents(player.id),
    getConsentReviewStatuses([player.id]),
  ]);
  const status = statuses.get(player.id);
  const firstTime = Boolean(status?.firstTime);

  const displayName = player.name?.trim() || player.user?.name || "Unnamed player";
  const age = player.dateOfBirth ? ageInYears(player.dateOfBirth.toISOString().slice(0, 10)) : null;
  const adult = age !== null && age >= 18;
  const guardian = player.parentGuardian;
  const blocked = !adult && !guardian;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/consent" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Consent</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        PAPER CONSENT FORM
      </h1>
      <p style={{ fontSize: "1rem", marginBottom: 20 }}>{displayName}</p>

      {search.saved === "1" && (
        <div role="status" style={{ ...noticeStyle, background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)" }}>
          The paper form has been recorded.
        </div>
      )}
      {search.error && ERRORS[search.error] && (
        <div role="alert" style={{ ...noticeStyle, background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)" }}>
          {ERRORS[search.error]}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>WHO SIGNS</h2>
        {adult ? (
          <p style={{ fontSize: "0.9rem" }}>
            The player is 18 or over, so <strong>the player</strong> must sign for themselves. A parent or guardian cannot consent on their behalf.
          </p>
        ) : guardian ? (
          <p style={{ fontSize: "0.9rem" }}>
            <strong>{guardian.firstName} {guardian.lastName}</strong> ({guardian.relationship}) &middot; {guardian.phone}
          </p>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "var(--card-red)" }}>
            This player has no linked guardian, so consent cannot be recorded yet.
          </p>
        )}
        <p style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: 8 }}>
          {status?.needsReview
            ? status.reasons.join(" ")
            : "This player's consent is up to date. Recording a new form replaces their choices and is logged."}
        </p>
      </div>

      {!blocked && (
        <form action={recordPaperConsent.bind(null, player.id)}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>ABOUT THE PAPER FORM</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <label style={labelStyle}>
                Date signed *
                <input type="date" name="signedOn" max={today} required style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Form version printed on it *
                <input name="formVersion" required placeholder={CONSENT_FORM_VERSION} maxLength={20} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Where it is filed
                <input name="paperReference" maxLength={100} placeholder="e.g. Folder 3, tab 12" style={inputStyle} />
              </label>
            </div>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 8 }}>
              Only forms printed from the current version ({CONSENT_FORM_VERSION}) can be recorded. Print a blank copy from
              the consent page, so the wording matches.
            </p>
          </div>

          <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", margin: "0 0 4px" }}>
              Required: the signed form shows these accepted
            </p>
            <RequiredCheck name="ack_dataProcessing">{REQUIRED_STATEMENTS.dataProcessing}</RequiredCheck>
            <RequiredCheck name="ack_statistics">{REQUIRED_STATEMENTS.statistics}</RequiredCheck>
            <RequiredCheck name="ack_emergencyTreatment">{REQUIRED_STATEMENTS.emergencyTreatment}</RequiredCheck>
            <RequiredCheck name="ack_declaration">{REQUIRED_STATEMENTS.declaration}</RequiredCheck>
          </div>

          <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0 0 12px" }}>
            Optional choices: tick only what the family ticked on the paper form. Anything left unticked is recorded as
            declined.{!firstTime && " Their current choices are filled in below. Check each against the paper form."}
          </p>
          <ConsentFields current={current} prefill={!firstTime} />

          <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <RequiredCheck name="seen_form">
              I have seen the original signed paper form and have entered it exactly as signed.
            </RequiredCheck>
          </div>

          <button type="submit" className="button">Record consent</button>
        </form>
      )}
    </div>
  );
}
