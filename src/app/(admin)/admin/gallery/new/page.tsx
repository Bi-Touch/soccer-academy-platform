import { prisma } from "@/lib/prisma";
import { createPhoto } from "../actions";

export default async function NewPhotoPage() {
  const teams = await prisma.team.findMany();

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD PHOTO</h1>

      <form action={createPhoto} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Photo URL
          <input name="url" required placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Caption (optional)
          <input name="caption" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Team (leave unassigned to show for all teams)
          <select name="teamId" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Add photo</button>
      </form>
    </div>
  );
}