"use client";

import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { BarChart } from "./BarChart";
import { GroupedBarChart } from "./GroupedBarChart";

type Team = { id: string; name: string };
type CareerStat = { id: string; season: string; matchesPlayed: number; goals: number; assists: number; minutesPlayed: number };
type ProgressNote = { id: string; authorName: string; note: string; createdAt: string };

export function EditPlayerTabs({
  playerName,
  dateOfBirth,
  photoUrl: initialPhotoUrl,
  position,
  shirtNumber,
  teamId,
  teams,
  currentSeason,
  currentStat,
  careerStats,
  positions,
  updatePlayerAction,
  upsertStatAction,
  playerId,
  progressNotes,
  addNoteAction,
  canEditProfile,
}: {
  playerName: string;
  dateOfBirth: string;
  photoUrl: string;
  position: string;
  shirtNumber: number | null;
  teamId: string;
  teams: Team[];
  currentSeason: string;
  currentStat: { matchesPlayed: number; goals: number; assists: number; minutesPlayed: number } | null;
  careerStats: CareerStat[];
  positions: string[];
  updatePlayerAction: (formData: FormData) => Promise<void>;
  upsertStatAction: (formData: FormData) => Promise<void>;
  playerId: string;
  progressNotes: ProgressNote[];
  addNoteAction: (formData: FormData) => Promise<void>;
  canEditProfile: boolean;
}) {
  const [tab, setTab] = useState<"profile" | "stats" | "career" | "notes">("profile");
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [attackingOpen, setAttackingOpen] = useState(true);
  const [playingTimeOpen, setPlayingTimeOpen] = useState(true);

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "stats", label: "Season Stats" },
    { key: "career", label: "Career Stats" },
    { key: "notes", label: "Coach Notes" },
  ];

  const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
  const labelStyle = { fontSize: "0.85rem" };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e3ded2", marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--floodlight)" : "2px solid transparent",
              color: tab === t.key ? "var(--pitch)" : "inherit",
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        canEditProfile ? (
          <form action={updatePlayerAction} style={{ paddingBottom: 88 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
              <PlayerAvatar src={photoUrl || null} alt={playerName || "Player"} size={72} rounded />
              <label style={{ ...labelStyle, flex: 1 }}>
                Photo URL
                <input
                  name="photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label style={labelStyle}>
                Full name
                <input name="name" defaultValue={playerName} required style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Date of birth
                <input name="dateOfBirth" type="date" defaultValue={dateOfBirth} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Position
                <select name="position" defaultValue={position} style={inputStyle}>
                  <option value="">Select a position</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                Shirt number
                <input name="shirtNumber" type="number" min={1} max={99} defaultValue={shirtNumber ?? ""} style={inputStyle} />
              </label>
            </div>

            <label style={{ ...labelStyle, display: "block", marginTop: 16 }}>
              Team
              <select name="teamId" defaultValue={teamId} style={inputStyle}>
                <option value="">Unassigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            <div style={{ position: "sticky", bottom: 0, background: "var(--chalk)", paddingTop: 16, marginTop: 24, borderTop: "1px solid #e3ded2" }}>
              <button type="submit" className="button">Save changes</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
              <PlayerAvatar src={photoUrl || null} alt={playerName || "Player"} size={72} rounded />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <p style={labelStyle}>Full name</p>
                <p style={{ marginTop: 4 }}>{playerName || "—"}</p>
              </div>
              <div>
                <p style={labelStyle}>Date of birth</p>
                <p style={{ marginTop: 4 }}>{dateOfBirth || "—"}</p>
              </div>
              <div>
                <p style={labelStyle}>Position</p>
                <p style={{ marginTop: 4 }}>{position || "—"}</p>
              </div>
              <div>
                <p style={labelStyle}>Shirt number</p>
                <p style={{ marginTop: 4 }}>{shirtNumber ?? "—"}</p>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={labelStyle}>Team</p>
              <p style={{ marginTop: 4 }}>{teams.find((t) => t.id === teamId)?.name || "Unassigned"}</p>
            </div>
            <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: 24 }}>
              Only an admin can edit profile details.
            </p>
          </div>
        )
      )}

      {tab === "stats" && (
        <form action={upsertStatAction} style={{ paddingBottom: 88 }}>
          <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: 16 }}>{currentSeason} season</p>

          <div style={{ background: "white", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setAttackingOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                color: "var(--pitch)",
              }}
            >
              Attacking
              <span>{attackingOpen ? "\u2212" : "+"}</span>
            </button>
            {attackingOpen && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 16px 16px" }}>
                <label style={labelStyle}>
                  Goals
                  <input name="goals" type="number" min={0} defaultValue={currentStat?.goals ?? 0} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Assists
                  <input name="assists" type="number" min={0} defaultValue={currentStat?.assists ?? 0} style={inputStyle} />
                </label>
              </div>
            )}
          </div>

          <div style={{ background: "white", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPlayingTimeOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                color: "var(--pitch)",
              }}
            >
              Playing Time
              <span>{playingTimeOpen ? "\u2212" : "+"}</span>
            </button>
            {playingTimeOpen && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 16px 16px" }}>
                <label style={labelStyle}>
                  Matches played
                  <input name="matchesPlayed" type="number" min={0} defaultValue={currentStat?.matchesPlayed ?? 0} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Minutes played
                  <input name="minutesPlayed" type="number" min={0} defaultValue={currentStat?.minutesPlayed ?? 0} style={inputStyle} />
                </label>
              </div>
            )}
          </div>

          <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>
            More categories (discipline, physical) can be added here later as the data model grows.
          </p>

          <div style={{ position: "sticky", bottom: 0, background: "var(--chalk)", paddingTop: 16, marginTop: 24, borderTop: "1px solid #e3ded2" }}>
            <button type="submit" className="button">Save stats</button>
          </div>
        </form>
      )}

      {tab === "career" && (
        <div>
          {careerStats.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No stats recorded for any season yet.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                    GOAL CONTRIBUTIONS
                  </h3>
                  <GroupedBarChart
                    labels={[...careerStats].reverse().map((s) => s.season)}
                    series={[
                      { name: "Goals", color: "var(--floodlight)", values: [...careerStats].reverse().map((s) => s.goals) },
                      { name: "Assists", color: "var(--pitch)", values: [...careerStats].reverse().map((s) => s.assists) },
                    ]}
                    height={140}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                    MATCHES
                  </h3>
                  <div style={{ height: 20, marginBottom: 12 }} />
                  <BarChart
                    data={[...careerStats].reverse().map((s) => ({ label: s.season, value: s.matchesPlayed }))}
                    orientation="vertical"
                    height={140}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
                    MINUTES
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 20, marginBottom: 12, fontSize: "0.8rem" }}>
                    <span style={{ width: 10, height: 10, background: "var(--card-red)", display: "inline-block" }} />
                    Minutes
                  </div>
                  <BarChart
                    data={[...careerStats].reverse().map((s) => ({ label: s.season, value: s.minutesPlayed }))}
                    orientation="vertical"
                    height={140}
                    color="var(--card-red)"
                  />
                </div>
              </div>

              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginTop: 32, marginBottom: 12 }}>
                FULL HISTORY
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
                    <th style={{ padding: "8px 0" }}>Season</th>
                    <th>Matches</th>
                    <th>Goals</th>
                    <th>Assists</th>
                    <th>Minutes</th>
                  </tr>
                </thead>
                <tbody>
                  {careerStats.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #e3ded2" }}>
                      <td style={{ padding: "8px 0" }}>{s.season}</td>
                      <td>{s.matchesPlayed}</td>
                      <td>{s.goals}</td>
                      <td>{s.assists}</td>
                      <td>{s.minutesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {tab === "notes" && (
        <div>
          <form action={addNoteAction} style={{ marginBottom: 32 }}>
            <label style={labelStyle}>
              Add a note
              <textarea
                name="note"
                required
                rows={4}
                placeholder="e.g. Great work rate in Tuesday's session, needs to work on left-foot finishing."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="button">Add note</button>
            </div>
          </form>

          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
            NOTE HISTORY
          </h3>

          {progressNotes.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No notes yet.</p>
          ) : (
            progressNotes.map((n) => (
              <div key={n.id} style={{ background: "white", padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: 6 }}>
                  {n.authorName} &middot; {new Date(n.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </p>
                <p style={{ margin: 0 }}>{n.note}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}