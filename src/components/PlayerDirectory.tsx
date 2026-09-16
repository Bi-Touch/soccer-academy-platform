"use client";

import { useState, useMemo } from "react";
import { PlayerAvatar } from "./PlayerAvatar";

type PlayerRow = {
  id: string;
  name: string;
  position: string | null;
  shirtNumber: number | null;
  photoUrl: string | null;
  teamName: string | null;
};

export function PlayerDirectory({
  players,
  teamNames,
  positions,
}: {
  players: PlayerRow[];
  teamNames: string[];
  positions: string[];
}) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesTeam = !teamFilter || p.teamName === teamFilter;
      const matchesPosition = !positionFilter || p.position === positionFilter;
      return matchesQuery && matchesTeam && matchesPosition;
    });
  }, [players, query, teamFilter, positionFilter]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          style={{ flex: 1, minWidth: 180, padding: 10, border: "1px solid #e3ded2" }}
        />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={{ padding: 10, border: "1px solid #e3ded2" }}>
          <option value="">All teams</option>
          {teamNames.map((t) => (
            <option key={t} value={t}>{t}</option>
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
        {filtered.length} player{filtered.length !== 1 ? "s" : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ textAlign: "center" }}>
            <PlayerAvatar src={p.photoUrl} alt={p.name} size={90} rounded />
            <div style={{ fontWeight: 600, marginTop: 10, fontSize: "0.95rem" }}>{p.name}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.65 }}>
              {p.position ?? "—"}{p.shirtNumber ? ` · #${p.shirtNumber}` : ""}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: 2 }}>{p.teamName ?? "Unassigned"}</div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ opacity: 0.7 }}>No players match your search.</p>}
      </div>
    </div>
  );
}