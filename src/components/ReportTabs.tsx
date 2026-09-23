"use client";

import { useState } from "react";

const REPORTS = [
  { key: "attendance", title: "Attendance", body: "Session-by-session attendance and rating trends per team." },
  { key: "assessments", title: "Development Assessments", body: "Squad-wide domain averages from the latest assessment per player." },
  { key: "physical", title: "Physical Tests", body: "Compare players' latest test results, metric by metric." },
  { key: "matches", title: "Match Stats", body: "Team goals trend, top scorers, and squad totals from logged matches." },
] as const;

type ReportKey = (typeof REPORTS)[number]["key"];

export function ReportTabs({
  attendance,
  assessments,
  physical,
  matches,
}: {
  attendance: React.ReactNode;
  assessments: React.ReactNode;
  physical: React.ReactNode;
  matches: React.ReactNode;
}) {
  const [active, setActive] = useState<ReportKey | null>(null);
  const content: Record<ReportKey, React.ReactNode> = { attendance, assessments, physical, matches };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 32 }}>
        {REPORTS.map((r) => {
          const isActive = active === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setActive(isActive ? null : r.key)}
              style={{
                textAlign: "left",
                display: "block",
                width: "100%",
                background: "white",
                borderTop: `3px solid ${isActive ? "var(--pitch)" : "var(--floodlight)"}`,
                padding: 20,
                cursor: "pointer",
                border: "none",
                borderTopWidth: 3,
                borderTopStyle: "solid",
                borderTopColor: isActive ? "var(--pitch)" : "var(--floodlight)",
                fontFamily: "inherit",
              }}
            >
              <h2 className="display" style={{ fontSize: "1.2rem", color: "var(--pitch)" }}>{r.title}</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>{r.body}</p>
              <span style={{ fontSize: "0.8rem", color: "var(--pitch)", marginTop: 12, display: "inline-block" }}>
                {isActive ? "− Hide" : "+ View report"}
              </span>
            </button>
          );
        })}
      </div>

      {active && <div style={{ marginTop: 32 }}>{content[active]}</div>}
    </div>
  );
}