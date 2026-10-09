"use client";

import { useState } from "react";
import { ASSESSMENT_ATTRIBUTES, DOMAIN_LABELS, attributeSlug, } from "@/lib/assessmentAttributes";

type Domain = keyof typeof ASSESSMENT_ATTRIBUTES;

export function AssessmentForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const domains = Object.keys(ASSESSMENT_ATTRIBUTES) as Domain[];
  const [activeTab, setActiveTab] = useState<Domain>(domains[0]);

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: 10,
    marginTop: 4,
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={action}
      style={{
        width: "100%",
        maxWidth: 640,
        minWidth: 0,
        boxSizing: "border-box",
        paddingBottom: 88,
      }}
    >
      <label style={{ fontSize: "0.85rem", display: "block" }}>
        Assessment date
        <input
          name="assessedAt"
          type="date"
          defaultValue={today}
          style={{ ...inputStyle, maxWidth: 240 }}
        />
      </label>

  {/* Responsive assessment domain tabs */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      borderBottom: "1px solid #e3ded2",
      marginTop: 32,
      marginBottom: 24,
    }}
  >
    {domains.map((domain) => (
      <button
        key={domain}
        type="button"
        onClick={() => setActiveTab(domain)}
        aria-pressed={activeTab === domain}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 2px",
          background: "none",
          border: "none",
          borderBottom:
            activeTab === domain
              ? "2px solid var(--floodlight)"
              : "2px solid transparent",
          color:
            activeTab === domain
              ? "var(--pitch)"
              : "inherit",
          fontWeight: activeTab === domain ? 600 : 400,
          cursor: "pointer",
          fontSize: "clamp(10px, 2.8vw, 14px)",
          lineHeight: 1.25,
          textAlign: "center",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }}
      >
        {DOMAIN_LABELS[domain]}
      </button>
    ))}
  </div>

      {/* Responsive attribute rating grid */}
      {domains.map((domain) => (
        <div
          key={domain}
          style={{
            display: activeTab === domain ? "grid" : "none",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
            width: "100%",
            minWidth: 0,
          }}
        >
          {ASSESSMENT_ATTRIBUTES[domain].map((attribute) => (
            <label
              key={attribute}
              style={{
                display: "block",
                minWidth: 0,
                fontSize: "0.85rem",
                overflowWrap: "anywhere",
              }}
            >
              {attribute}

              <select
                name={`score_${domain}_${attributeSlug(attribute)}`}
                defaultValue=""
                style={inputStyle}
              >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ))}

      <label
        style={{ fontSize: "0.85rem", display: "block", marginTop: 32,}}>
        Summary
        <textarea
          name="summary"
          rows={3}
          placeholder="Overall impression from this assessment..."
          style={{
            ...inputStyle,
            resize: "none",
          }}
        />
      </label>

      <label
        style={{ fontSize: "0.85rem", display: "block", marginTop: 16,}}>
        Goals for next period
        <textarea
          name="nextGoals"
          rows={3}
          placeholder="What should this player focus on before the next assessment?"
          style={{
            ...inputStyle,
            resize: "none",
          }}
        />
      </label>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--chalk)",
          paddingTop: 16,
          paddingBottom: 8,
          marginTop: 24,
          borderTop: "1px solid #e3ded2",
        }}
      >
        <button type="submit" className="button"> Save assessment </button>
      </div>
    </form>
  );
}