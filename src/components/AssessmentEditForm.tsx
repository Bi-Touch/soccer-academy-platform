"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { DOMAINS, DOMAIN_LABELS, ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";

const ATTRS = ASSESSMENT_ATTRIBUTES as Record<string, string[]>;
const LABELS = DOMAIN_LABELS as Record<string, string>;

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
const labelStyle = { fontSize: "0.85rem" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function AssessmentEditForm({
  action,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: { assessedAt: string; summary: string; nextGoals: string; scores: Record<string, number> };
}) {
  const [active, setActive] = useState<string>(String(DOMAINS[0]));

  return (
    <form action={action} style={{ paddingBottom: 88 }}>
      <label style={labelStyle}>
        Assessment date
        <input name="assessedAt" type="date" defaultValue={defaults.assessedAt} style={{ ...inputStyle, maxWidth: 260 }} />
      </label>

      <div style={{ display: "flex", borderBottom: "1px solid #e3ded2", margin: "28px 0 20px" }}>
        {DOMAINS.map((d) => {
          const key = String(d);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 4px",
                textAlign: "center",
                lineHeight: 1.2,
                fontSize: "0.85rem",
                background: "none",
                border: "none",
                borderBottom: active === key ? "2px solid var(--floodlight)" : "2px solid transparent",
                color: active === key ? "var(--pitch)" : "inherit",
                fontWeight: active === key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {LABELS[key] ?? key}
            </button>
          );
        })}
      </div>

      {DOMAINS.map((d) => {
        const key = String(d);
        return (
          <div
            key={key}
            style={{ display: active === key ? "grid" : "none", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {ATTRS[key].map((attr) => (
              <label key={attr} style={labelStyle}>
                {attr}
                <select name={`score_${attr}`} defaultValue={defaults.scores[attr] ?? ""} style={inputStyle}>
                  <option value="">Not rated</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        );
      })}

      <label style={{ ...labelStyle, display: "block", marginTop: 28 }}>
        Summary
        <textarea name="summary" rows={3} defaultValue={defaults.summary} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
        Goals for next period
        <textarea name="nextGoals" rows={3} defaultValue={defaults.nextGoals} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <div style={{ position: "sticky", bottom: 0, background: "var(--chalk)", paddingTop: 16, marginTop: 24, borderTop: "1px solid #e3ded2" }}>
        <SaveButton />
      </div>
    </form>
  );
}