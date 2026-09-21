"use client";

import { useState } from "react";
import { ASSESSMENT_ATTRIBUTES, DOMAIN_LABELS, attributeSlug } from "@/lib/assessmentAttributes";

type Domain = keyof typeof ASSESSMENT_ATTRIBUTES;

export function AssessmentForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const domains = Object.keys(ASSESSMENT_ATTRIBUTES) as Domain[];
  const [activeTab, setActiveTab] = useState<Domain>(domains[0]);

  const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} style={{ maxWidth: 640, paddingBottom: 88 }}>
      <label style={{ fontSize: "0.85rem" }}>
        Assessment date
        <input name="assessedAt" type="date" defaultValue={today} style={{ ...inputStyle, maxWidth: 240 }} />
      </label>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e3ded2", marginTop: 32, marginBottom: 24 }}>
        {domains.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => setActiveTab(domain)}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === domain ? "2px solid var(--floodlight)" : "2px solid transparent",
              color: activeTab === domain ? "var(--pitch)" : "inherit",
              fontWeight: activeTab === domain ? 600 : 400,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {DOMAIN_LABELS[domain]}
          </button>
        ))}
      </div>

      {domains.map((domain) => (
        <div key={domain} style={{ display: activeTab === domain ? "grid" : "none", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {ASSESSMENT_ATTRIBUTES[domain].map((attribute) => (
            <label key={attribute} style={{ fontSize: "0.85rem" }}>
              {attribute}
              <select name={`score_${domain}_${attributeSlug(attribute)}`} defaultValue="" style={inputStyle}>
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ))}

      <label style={{ fontSize: "0.85rem", display: "block", marginTop: 32 }}>
        Summary
        <textarea name="summary" rows={3} placeholder="Overall impression from this assessment..." style={inputStyle} />
      </label>

      <label style={{ fontSize: "0.85rem", display: "block", marginTop: 16 }}>
        Goals for next period
        <textarea name="nextGoals" rows={3} placeholder="What should this player focus on before the next assessment?" style={inputStyle} />
      </label>

      <div style={{ position: "sticky", bottom: 0, background: "var(--chalk)", paddingTop: 16, marginTop: 24, borderTop: "1px solid #e3ded2" }}>
        <button type="submit" className="button">Save assessment</button>
      </div>
    </form>
  );
}