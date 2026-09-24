"use client";

import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { MATCH_STAT_GROUPS } from "@/lib/matchStats";

type Player = { id: string; name: string; photoUrl: string | null; position: string | null };
type ExistingRecord = Record<string, number>;

const GROUP_COLORS: Record<string, string> = {
  "Playing Time": "var(--pitch)",
  "Attacking": "var(--floodlight)",
  "Passing": "var(--pitch)",
  "Defending": "var(--floodlight)",
  "Discipline": "var(--card-red)",
};

function StatStepper({ name, defaultValue }: { name: string; defaultValue: number }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid #e3ded2", borderRadius: 6, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setValue((v) => Math.max(0, v - 1))}
        aria-label="Decrease"
        style={{
          width: 28,
          height: 32,
          border: "none",
          background: "#f4f1ea",
          cursor: "pointer",
          fontSize: "0.95rem",
          color: "var(--pitch)",
        }}
      >
        −
      </button>
      <input
        name={name}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
        style={{
          width: 40,
          height: 32,
          border: "none",
          borderLeft: "1px solid #e3ded2",
          borderRight: "1px solid #e3ded2",
          textAlign: "center",
          fontSize: "0.85rem",
          fontWeight: 600,
          appearance: "textfield",
        }}
      />
      <button
        type="button"
        onClick={() => setValue((v) => v + 1)}
        aria-label="Increase"
        style={{
          width: 28,
          height: 32,
          border: "none",
          background: "#f4f1ea",
          cursor: "pointer",
          fontSize: "0.95rem",
          color: "var(--pitch)",
        }}
      >
        +
      </button>
    </div>
  );
}

export function MatchStatsForm({
  players,
  existing,
  action,
}: {
  players: Player[];
  existing: Record<string, ExistingRecord>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  return (
    <form action={action} style={{ paddingBottom: 88 }}>
      {players.map((p) => {
        const record = existing[p.id] ?? {};
        const isOpen = openPlayerId === p.id;
        const hasData = Object.values(record).some((v) => v > 0);

        return (
          <div
            key={p.id}
            style={{
              background: "white",
              border: "1px solid #e3ded2",
              borderRadius: 8,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenPlayerId(isOpen ? null : p.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: isOpen ? "#faf8f3" : "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <PlayerAvatar src={p.photoUrl} alt={p.name} size={36} rounded />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{p.position ?? "—"}</div>
              </div>
              {hasData && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--floodlight)",
                    background: "#fdf3e2",
                    padding: "3px 10px",
                    borderRadius: 12,
                  }}
                >
                  Has stats
                </span>
              )}
              <span
                style={{
                  fontSize: "1rem",
                  opacity: 0.5,
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {/* Always mounted so every player's values submit, even when collapsed — only visually hidden */}
            <div
              style={{
                display: isOpen ? "grid" : "none",
                padding: "8px 20px 24px",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "24px 40px",
                borderTop: "1px solid #e3ded2",
              }}
            >
              {MATCH_STAT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h4
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--pitch)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      marginTop: 16,
                      marginBottom: 10,
                      paddingLeft: 10,
                      borderLeft: `3px solid ${GROUP_COLORS[group.title] ?? "var(--pitch)"}`,
                    }}
                  >
                    {group.title}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {group.fields.map((f) => (
                      <div
                        key={f.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: "0.82rem", opacity: 0.8 }}>{f.label}</span>
                        <StatStepper name={`${f.key}_${p.id}`} defaultValue={record[f.key] ?? 0} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--chalk)",
          paddingTop: 16,
          marginTop: 16,
          borderTop: "1px solid #e3ded2",
        }}
      >
        <button type="submit" className="button">Save match stats</button>
      </div>
    </form>
  );
}