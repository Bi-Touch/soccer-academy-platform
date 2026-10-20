import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDate } from "@/lib/dates";
import { CONSENT_GROUPS, getCurrentConsents } from "@/lib/consentLedger";
import { updateConsents } from "./actions";

export default async function ParentChildConsentPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await props.params;
  const search = await props.searchParams;
  const { player, child } = await requireOwnedChild(params.id);

  const [current, registration] = await Promise.all([
    getCurrentConsents(player.id),
    prisma.playerRegistration.findFirst({
      where: { createdPlayerId: player.id },
      include: { consent: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const registrationConsent = registration?.consent ?? null;

  return (
    <ChildPageShell child={child} active="consent">
      {current.size === 0 ? (
        <p style={{ opacity: 0.7 }}>
          Consent choices have not been recorded for this player yet. Please contact the Academy.
        </p>
      ) : (
        <>
          {search.saved === "1" && (
            <div
              role="status"
              style={{ background: "#e7f3ed", border: "1px solid var(--pitch)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem", color: "var(--pitch)" }}
            >
              Your choices have been saved.
            </div>
          )}

          <form action={updateConsents.bind(null, player.id)}>
            {CONSENT_GROUPS.map((group) => (
              <fieldset
                key={group.title}
                style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: "12px 16px", margin: "0 0 16px", minWidth: 0 }}
              >
                <legend style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", padding: "0 6px" }}>
                  {group.title}
                </legend>
                {group.intro && (
                  <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: "0 0 4px" }}>{group.intro}</p>
                )}
                {group.items.map((item) => {
                  const state = current.get(item.type);
                  return (
                    <label
                      key={item.type}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", padding: "8px 0" }}
                    >
                      <input
                        type="checkbox"
                        name={`consent_${item.type}`}
                        defaultChecked={state?.granted ?? false}
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        {item.label}
                        {item.description && (
                          <span style={{ display: "block", fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>
                            {item.description}
                          </span>
                        )}
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.55, marginTop: 2 }}>
                          {state ? `Last changed ${formatDate(state.changedAt)}` : "Not recorded"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}

            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0 0 12px" }}>
              Changes apply from the moment you save. Withdrawing a consent stops future use, but information that has
              already been shared with another organisation cannot be taken back. The Academy will follow up on any
              withdrawal. Withdrawing health consent means coaches will no longer see your child&apos;s medical
              information, so make sure the Academy knows about anything urgent such as severe allergies.
            </p>

            <button type="submit" className="button">Save changes</button>
          </form>

          {registrationConsent && (
            <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 16 }}>
              Required acknowledgements (use of information, statistics and emergency treatment) were accepted on{" "}
              {formatDate(registrationConsent.consentedAt)} (form version {registrationConsent.consentVersion}).
            </p>
          )}
        </>
      )}
    </ChildPageShell>
  );
}
