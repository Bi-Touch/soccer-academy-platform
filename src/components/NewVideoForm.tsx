"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TeamOption = { id: string; name: string };
type PlayerOption = { id: string; name: string; teamId: string | null; teamName: string | null };

const fieldStyle: React.CSSProperties = { display: "block", width: "100%", padding: 10, marginTop: 4 };

export function NewVideoForm({
  action,
  teams,
  players,
  isAdmin,
}: {
  action: (formData: FormData) => Promise<void>;
  teams: TeamOption[];
  players: PlayerOption[];
  isAdmin: boolean;
}) {
  // Coaches have no "All teams" option, so start on their first team to match what the select shows.
  const [teamId, setTeamId] = useState(isAdmin ? "" : teams[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const playerById = useMemo(
    () => new Map<string, PlayerOption>(players.map((p) => [p.id, p] as const)),
    [players]
  );

  const teamPlayers = useMemo(
    () => (teamId ? players.filter((p) => p.teamId === teamId) : players),
    [players, teamId]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? teamPlayers.filter((p) => p.name.toLowerCase().includes(q)) : teamPlayers;
  }, [teamPlayers, query]);

  const selectedPlayers = players.filter((p) => selected.includes(p.id));

  function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setTeamId(next);
    setQuery("");
    // Drop anyone tagged from a different team than the one just chosen.
    if (next) setSelected((prev) => prev.filter((id) => playerById.get(id)?.teamId === next));
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const triggerLabel =
    selected.length === 0
      ? "Select players…"
      : `${selected.length} player${selected.length === 1 ? "" : "s"} selected`;

  return (
    <form action={action} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <label>
        Title
        <input name="title" required style={fieldStyle} />
      </label>

      <label>
        Video URL (YouTube, Vimeo, or any direct link)
        <input name="url" required placeholder="https://youtube.com/watch?v=..." style={fieldStyle} />
      </label>

      <label>
        Thumbnail URL (optional)
        <input name="thumbnailUrl" placeholder="https://..." style={fieldStyle} />
      </label>

      <label>
        Description (optional)
        <textarea name="description" rows={3} style={fieldStyle} />
      </label>

      <label>
        Team{isAdmin ? " (leave unassigned to show it to every team)" : ""}
        <select name="teamId" required={!isAdmin} value={teamId} onChange={handleTeamChange} style={fieldStyle}>
          {isAdmin && <option value="">All teams</option>}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      {/* Selected players always submit, even while the dropdown is closed. */}
      {selected.map((id) => (
        <input key={id} type="hidden" name="playerIds" value={id} />
      ))}

      <div>
        <span>Tag players (optional)</span>

        <div ref={wrapRef} style={{ position: "relative", marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: 10,
              background: "white",
              border: "1px solid #767676",
              borderRadius: 2,
              textAlign: "left",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ opacity: selected.length === 0 ? 0.65 : 1 }}>{triggerLabel}</span>
            <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{open ? "\u25B2" : "\u25BC"}</span>
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 20,
                background: "white",
                border: "1px solid #e3ded2",
                borderRadius: 8,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ padding: 8, borderBottom: "1px solid #e3ded2" }}>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder="Search players…"
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0" }}>
                {matches.map((p) => (
                  <label
                    key={p.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: "0.9rem", cursor: "pointer" }}
                  >
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span style={{ flex: 1 }}>{p.name}</span>
                    {!teamId && p.teamName && (
                      <span style={{ opacity: 0.55, fontSize: "0.8rem" }}>{p.teamName}</span>
                    )}
                  </label>
                ))}
                {matches.length === 0 && (
                  <p style={{ padding: "8px 12px", opacity: 0.6, fontSize: "0.85rem" }}>
                    {teamPlayers.length === 0 ? "No players on this team yet." : "No players match your search."}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid #e3ded2" }}>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={selected.length === 0}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: selected.length === 0 ? "default" : "pointer",
                    opacity: selected.length === 0 ? 0.35 : 0.8,
                    fontSize: "0.85rem",
                    padding: 0,
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, color: "var(--pitch)", fontSize: "0.85rem", padding: 0 }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedPlayers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {selectedPlayers.map((p) => (
              <span
                key={p.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  background: "var(--chalk)",
                  border: "1px solid #e3ded2",
                  borderRadius: 999,
                  padding: "3px 4px 3px 10px",
                  fontSize: "0.8rem",
                }}
              >
                {p.name}
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-label={`Remove ${p.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0 6px", fontSize: "1rem", lineHeight: 1 }}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <p style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: 8 }}>
          {selected.length > 0
            ? `Only ${selected.length === 1 ? "this player" : `these ${selected.length} players`} will see this video.`
            : `No players tagged — ${teamId ? "the whole team" : "every team"} will see this video.`}
        </p>
      </div>

      <button type="submit" className="button" style={{ marginTop: 8 }}>Publish video</button>
    </form>
  );
}