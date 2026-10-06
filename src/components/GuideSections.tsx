"use client";

import { useState } from "react";

const SECTIONS = [
  { key: "physical", title: "Physical Tests", body: "Test protocols and what each one measures." },
  { key: "training", title: "Training Log", body: "Attendance, ratings, and session notes." },
  { key: "schedule", title: "Schedule", body: "Events, types, and match results." },
  { key: "matches", title: "Match Stats", body: "Field-by-field definitions for every match stat." },
  { key: "assessments", title: "Assessments", body: "Rating scale and what each attribute looks for." },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function GuideSections({
  physical,
  training,
  schedule,
  matches,
  assessments,
}: {
  physical: React.ReactNode;
  training: React.ReactNode;
  schedule: React.ReactNode;
  matches: React.ReactNode;
  assessments: React.ReactNode;
}) {
  const [active, setActive] = useState<SectionKey>("physical");
  const content: Record<SectionKey, React.ReactNode> = { physical, training, schedule, matches, assessments };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        {SECTIONS.map((s) => {
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              style={{
                textAlign: "left",
                background: "white",
                borderTop: `3px solid ${isActive ? "var(--pitch)" : "var(--floodlight)"}`,
                borderLeft: "1px solid #e3ded2",
                borderRight: "1px solid #e3ded2",
                borderBottom: "1px solid #e3ded2",
                padding: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isActive ? "var(--pitch)" : "inherit" }}>{s.title}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: 4 }}>{s.body}</div>
            </button>
          );
        })}
      </div>

      {content[active]}
    </div>
  );
}