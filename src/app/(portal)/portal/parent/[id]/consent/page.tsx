import type { ReactNode } from "react";
import type { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDate } from "@/lib/dates";
import { CONSENT_GROUPS, getCurrentConsents, type CurrentConsent } from "@/lib/consentLedger";
import { getConsentReviewStatuses } from "@/lib/consentReview";
import { confirmConsents, updateConsents } from "./actions";

const boxStyle = { background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: "12px 16px", margin: "0 0 16px", minWidth: 0 } as const;
const legendStyle = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", padding: "0 6px" } as const;
const noticeStyle = { borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" } as const;

/** The optional consent choices, grouped as on the registration form. */
function ConsentGroups({
  current,
  prefill,
}: {
  current: Map<ConsentType, CurrentConsent>;
  prefill: boolean;
}) {
  return (
    <>
      {CONSENT_GROUPS.map((group) => (
        <fieldset key={group.title} style={boxStyle}>
          <legend style={legendStyle}>{group.title}</legend>
          {group.intro && <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: "0 0 4px" }}>{group.intro}</p>}
          {group.items.map((item) => {
            const state = current.get(item.type);
            return (
              <label key={item.type} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "8px 0" }}>
                <input
                  type="checkbox"
                  name={`consent_${item.type}`}
                  defaultChecked={prefill ? (state?.granted ?? false) : false}
                  style={{ marginTop: 3 }}
                />
                <span>
                  {item.label}
                  {item.description && (
                    <span style={{ display: "block", fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>{item.description}</span>
                  )}
                  {state && (
                    <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.55, marginTop: 2 }}>
                      Last changed {formatDate(state.changedAt)}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </>
  );
}

function RequiredCheck({ name, children }: { name: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "8px 0" }}>
      <input type="checkbox" name={name} required style={{ marginTop: 3 }} />
      <span>
        {children}
        <span style={{ color: "var(--card-red)" }} aria-hidden="true"> *</span>
      </span>
    </label>
  );
}

export default async function ParentChildConsentPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await props.params;
  const search = await props.searchParams;
  const { player, child } = await requireOwnedChild(params.id);

  const [current, statuses, registration] = await Promise.all([
    getCurrentConsents(player.id),
    getConsentReviewStatuses([player.id]),
    prisma.playerRegistration.findFirst({
      where: { createdPlayerId: player.id },
      include: { consent: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const registrationConsent = registration?.consent ?? null;
  const status = statuses.get(player.id);
  const reviewMode = Boolean(status?.needsReview);
  const firstTime = Boolean(status?.firstTime);

  return (
    <ChildPageShell child={child} active="consent">
      {search.saved === "1" && (
        <div role="status" style={{ ...noticeStyle, background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)" }}>
          Your choices have been saved.
        </div>
      )}
      {search.error === "required" && (
        <div role="alert" style={{ ...noticeStyle, background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)" }}>
          Please accept all the required items marked * to continue.
        </div>
      )}

      {reviewMode ? (
        <>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--pitch)", margin: "0 0 8px" }}>
            {firstTime ? "Set up your consent choices" : "Please review and confirm your consent choices"}
          </h2>
          <ul style={{ fontSize: "0.9rem", opacity: 0.85, margin: "0 0 12px", paddingLeft: 18 }}>
            {status?.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
          <p style={{ fontSize: "0.85rem", opacity: 0.75, margin: "0 0 16px" }}>
            Items marked * are needed so the Academy can look after your child. Everything else is optional, and you
            can change or withdraw any optional consent at any time from this page.
            {!firstTime && " Your current choices are filled in below."}
          </p>

          <form action={confirmConsents.bind(null, player.id)}>
            <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", margin: "0 0 4px" }}>Required</p>
              <RequiredCheck name="ack_dataProcessing">
                I understand that the Academy will collect and use the player&apos;s personal information to run
                registration, training and matches, to keep players safe (including safeguarding) and to support
                their development, as explained in the Privacy Policy.
              </RequiredCheck>
              <RequiredCheck name="ack_statistics">
                I understand that training and match statistics will be recorded and used for coaching and player
                development.
              </RequiredCheck>
              <RequiredCheck name="ack_emergencyTreatment">
                If I cannot be reached in an emergency, I authorise Academy staff to arrange urgent medical
                treatment for the player.
              </RequiredCheck>
              <RequiredCheck name="ack_declaration">
                I confirm that I am the player&apos;s parent or legal guardian with authority to give these
                consents, and I have read and understood the{" "}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pitch)", textDecoration: "underline" }}>
                  Privacy Policy
                </a>
                .
              </RequiredCheck>
            </div>

            <ConsentGroups current={current} prefill={!firstTime} />

            <button type="submit" className="button">Confirm my choices</button>
          </form>
        </>
      ) : (
        <>
          <form action={updateConsents.bind(null, player.id)}>
            <ConsentGroups current={current} prefill />

            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0 0 12px" }}>
              Changes apply from the moment you save. Withdrawing a consent stops future use, but information that has
              already been shared with another organisation cannot be taken back. The Academy will follow up on any
              withdrawal. Withdrawing health consent means coaches will no longer see your child&apos;s medical
              information, so make sure the Academy knows about anything urgent such as severe allergies.
            </p>

            <button type="submit" className="button">Save changes</button>
          </form>
        </>
      )}

      {registrationConsent && (
        <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 16 }}>
          Registration accepted on {formatDate(registrationConsent.consentedAt)} (form version{" "}
          {registrationConsent.consentVersion}).
        </p>
      )}
    </ChildPageShell>
  );
}