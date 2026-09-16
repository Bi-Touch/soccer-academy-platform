import { prisma } from "@/lib/prisma";
import { updateTeam } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditTeamPage({ params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return notFound();

  const updateWithId = updateTeam.bind(null, team.id);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>EDIT TEAM</h1>

      <form action={updateWithId} style={{ maxWidth: 420, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Team name
          <input name="name" defaultValue={team.name} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Age group
          <input name="ageGroup" defaultValue={team.ageGroup} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Crest image URL (optional)
          <input name="crestUrl" defaultValue={team.crestUrl ?? ""} placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Save changes</button>
      </form>
    </div>
  );
}