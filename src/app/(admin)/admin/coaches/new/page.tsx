import { prisma } from "@/lib/prisma";
import { createCoach } from "../actions";

export default async function NewCoachPage() {
  const teams = await prisma.team.findMany();

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD COACH</h1>

      <form action={createCoach} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Full name
          <input name="name" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Email (used to log in)
          <input name="email" type="email" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Temporary password
          <input name="password" type="password" required minLength={8} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Title
          <input name="title" placeholder="e.g. Head Coach, U15s" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Photo URL
          <input name="photoUrl" placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Bio
          <textarea name="bio" rows={4} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Teams coached (hold Ctrl/Cmd to select multiple)
          <select name="teamIds" multiple size={4} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Create coach</button>
      </form>
    </div>
  );
}