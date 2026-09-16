import { prisma } from "@/lib/prisma";
import { updateCoach } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditCoachPage({ params }: { params: { id: string } }) {
  const [coach, teams] = await Promise.all([
    prisma.coach.findUnique({ where: { id: params.id }, include: { user: true, teams: true } }),
    prisma.team.findMany(),
  ]);

  if (!coach) return notFound();

  const updateWithId = updateCoach.bind(null, coach.id);
  const assignedTeamIds = new Set(coach.teams.map((t) => t.id));

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>EDIT COACH</h1>

      <form action={updateWithId} style={{ maxWidth: 480, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Full name
          <input name="name" defaultValue={coach.user.name} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Title
          <input name="title" defaultValue={coach.title ?? ""} placeholder="e.g. Head Coach, U15s" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Photo URL
          <input name="photoUrl" defaultValue={coach.photoUrl ?? ""} placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Bio
          <textarea name="bio" rows={4} defaultValue={coach.bio ?? ""} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Teams coached (hold Ctrl/Cmd to select multiple)
          <select name="teamIds" multiple size={4} defaultValue={[...assignedTeamIds]} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Save changes</button>
      </form>
    </div>
  );
}