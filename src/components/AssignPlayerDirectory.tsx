"use client";

import { useState, useMemo } from "react";

type Team = { id: string; name: string };
type UnassignedPlayer = { id: string; name: string; position: string | null; ageGroup: string };

export function AssignPlayerDirectory({
  players,
  teams,
  ageGroups,
  positions,
  assignAction,
}: {
  players: UnassignedPlayer[];
  teams: Team[];
  ageGroups: string[];
  positions: string[];
  assignAction: (playerId: string, formData: FormData) => Promise<void>;
}) {
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesAgeGroup = !ageGroupFilter || p.ageGroup === ageGroupFilter;
      const matchesPosition = !positionFilter || p.position === positionFilter;
      return matchesAgeGroup && matchesPosition;
    });
  }, [players, ageGroupFilter, positionFilter]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <select value={ageGroupFilter} onChange={(e) => setAgeGroupFilter(e.target.value)} style={{ padding: 10, border: "1px solid #e3ded2" }}>
          <option value="">All age groups</option>
          {ageGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} style={{ padding: 10, border: "1px solid #e3ded2" }}>
          <option value="">All positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: 16 }}>
        {filtered.length} unassigned player{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No unassigned players match those filters.</p>
      ) : (
        filtered.map((p) => (
          <div key={p.id} style={{ background: "white", padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 600 }}>{p.name}</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                {p.position || "No position set"} · {p.ageGroup}
              </p>
            </div>
            <form action={assignAction.bind(null, p.id)} style={{ display: "flex", gap: 8 }}>
              <select name="teamId" required style={{ padding: 8 }}>
                <option value="">Select a team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="submit" className="button">Add to team</button>
            </form>
          </div>
        ))
      )}
    </div>
  );
}