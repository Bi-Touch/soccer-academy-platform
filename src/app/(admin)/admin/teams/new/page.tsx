import { createTeam } from "../actions";

export default function NewTeamPage() {
  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD TEAM</h1>

      <form action={createTeam} style={{ maxWidth: 420, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Team name
          <input name="name" required placeholder="e.g. U15 Eagles" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Age group
          <input name="ageGroup" required placeholder="e.g. U15" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Crest image URL (optional)
          <input name="crestUrl" placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Create team</button>
      </form>
    </div>
  );
}