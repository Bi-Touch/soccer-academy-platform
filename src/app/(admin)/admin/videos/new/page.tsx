import { prisma } from "@/lib/prisma";
import { createVideo } from "../actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function NewVideoPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;
  const isAdmin = accessibleTeamIds === null;

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD VIDEO</h1>

      <form action={createVideo} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Title
          <input name="title" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Video URL (YouTube, Vimeo, or any direct link)
          <input name="url" required placeholder="https://youtube.com/watch?v=..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Thumbnail URL (optional)
          <input name="thumbnailUrl" placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Description (optional)
          <textarea name="description" rows={3} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Team{isAdmin ? " (leave unassigned to show it to every team)" : ""}
          <select name="teamId" required={!isAdmin} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            {isAdmin && <option value="">All teams</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Publish video</button>
      </form>
    </div>
  );
}