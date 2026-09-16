import { prisma } from "@/lib/prisma";
import { createPlayer } from "../actions";
import { POSITIONS } from "@/lib/positions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function NewPlayerPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/players/assign");
  }
  const accessibleTeamIds = await getAccessibleTeamIds(user);

  const teams = await prisma.team.findMany({
    where: accessibleTeamIds ? { id: { in: accessibleTeamIds } } : undefined,
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ADD PLAYER</h1>

      <form action={createPlayer} style={{ maxWidth: 420, marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
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
          Date of birth
          <input name="dateOfBirth" type="date" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Photo URL
          <input name="photoUrl" placeholder="https://..." style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Position
          <select name="position" defaultValue="" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            <option value="">Select a position</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </label>

        <label>
          Shirt number
          <input name="shirtNumber" type="number" min={1} max={99} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Team
          <select name="teamId" required={accessibleTeamIds !== null} style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}>
            {accessibleTeamIds === null && <option value="">Unassigned</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="button" style={{ marginTop: 8 }}>Create player</button>
      </form>
    </div>
  );
}