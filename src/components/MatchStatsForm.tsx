"use client";

import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { MATCH_STAT_GROUPS } from "@/lib/matchStats";

type Player = { id: string; name: string; photoUrl: string | null; position: string | null };
type ExistingRecord = Record<string, number>;

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
  const inputStyle = { display: "block", width: "100%", padding: 8, marginTop: 4 };

  return (
    <form action={action} style={{ paddingBottom: 88 }}>
      {players.map((p) => {
        const record = existing[p.id] ?? {};
        const isOpen = openPlayerId === p.id;
        const hasData = Object.values(record).some((v) => v > 0);

        return (
          <div key={p.id} style={{ background: "white", marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setOpenPlayerId(isOpen ? null : p.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <PlayerAvatar src={p.photoUrl} alt={p.name} size={32} rounded />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{p.position ?? "—"}</div>
              </div>
              {hasData && <span style={{ fontSize: "0.75rem", color: "var(--floodlight)" }}>Has stats</span>}
              <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>{isOpen ? "\u2212" : "+"}</span>
            </button>

            {isOpen && (
              <div style={{ padding: "0 16px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {MATCH_STAT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--pitch)", textTransform: "uppercase", marginBottom: 8 }}>
                      {group.title}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {group.fields.map((f) => (
                        <label key={f.key} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ opacity: 0.8 }}>{f.label}</span>
                          <input
                            name={`${f.key}_${p.id}`}
                            type="number"
                            min={0}
                            defaultValue={record[f.key] ?? 0}
                            style={{ width: 64, padding: 6, textAlign: "right" }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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