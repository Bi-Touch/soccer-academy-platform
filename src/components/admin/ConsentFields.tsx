import type { ConsentType } from "@prisma/client";
import { CONSENT_GROUPS, type CurrentConsent } from "@/lib/consentLedger";
import { formatDate } from "@/lib/dates";

const boxStyle = { background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: "12px 16px", margin: "0 0 16px", minWidth: 0 } as const;
const legendStyle = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", padding: "0 6px" } as const;

/** The optional consent choices as checkboxes named consent_<TYPE>. */
export function ConsentFields({
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
                      Current choice recorded {formatDate(state.changedAt)}
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
