import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccessibleTeamIds, requireConcernReporter } from "@/lib/permissions";
import { CATEGORY_LABELS, EMERGENCY_NOTICE } from "@/lib/safeguarding";
import { raiseConcern } from "../actions";

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem", display: "block", marginTop: 14 } as const;

const ERRORS: Record<string, string> = {
  category: "Please choose what the concern is about.",
  description: "Please describe what happened (at least a sentence).",
  player: "That child could not be selected. Choose a child from your own teams, or name them in the description.",
  secure:
    "This could not be saved securely, so nothing was saved. Please tell the safeguarding lead directly, today.",
};

/**
 * Open to every adult who works with players. After submitting they cannot read the concern again:
 * only the safeguarding lead can.
 */
export default async function RaiseConcernPage(props: {
  searchParams: Promise<{ raised?: string; error?: string }>;
}) {
  const user = await requireConcernReporter().catch(() => null);
  if (!user) notFound();

  const search = await props.searchParams;

  // Coaches can pick children from their own teams. Everyone else can pick any child.
  const teamIds = user.role === "COACH" ? await getAccessibleTeamIds(user) : null;
  const players = await prisma.player.findMany({
    where: teamIds === null ? {} : { teamId: { in: teamIds } },
    select: { id: true, name: true, user: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>RAISE A CONCERN</h1>

      <div role="note" style={{ background: "#fdecec", border: "1px solid var(--card-red)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
        <strong>{EMERGENCY_NOTICE}</strong>
      </div>

      {search.raised && (
        <div role="status" style={{ background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
          Thank you. Your concern has been recorded with the reference <strong>SG-{search.raised}</strong> and is now with
          the safeguarding lead. Please also tell the lead in person if it is urgent. You will not be able to read it again.
        </div>
      )}
      {search.error && ERRORS[search.error] && (
        <div role="alert" style={{ background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
          {ERRORS[search.error]}
        </div>
      )}

      <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Write down only what you saw or heard: what happened, when, who was there, and the exact words a child used. Do not
        investigate, question the child, or confront anyone. Only the safeguarding lead can read what you write.
      </p>

      <form action={raiseConcern}>
        <label style={labelStyle}>
          Which child is this about?
          <select name="playerId" defaultValue="" style={inputStyle}>
            <option value="">Not about one specific child, or someone not listed (describe below)</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name?.trim() || p.user?.name || "Unnamed player"}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          What is the concern about? *
          <select name="category" required defaultValue="" style={inputStyle}>
            <option value="" disabled>Choose one</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Date it happened (if known)
          <input type="date" name="incidentOn" max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          What happened? *
          <textarea name="description" required minLength={10} maxLength={5000} rows={8} style={{ ...inputStyle, resize: "vertical" }} />
        </label>

        <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "12px 0" }}>
          This is stored encrypted. The audit log records only that a concern was raised.
        </p>
        <button type="submit" className="button">Submit concern</button>
        {" "}
        {user.role === "SAFEGUARDING_LEAD" && (
          <Link href="/admin/safeguarding" style={{ fontSize: "0.9rem", marginLeft: 12, textDecoration: "underline" }}>Back to safeguarding</Link>
        )}
      </form>
    </div>
  );
}
