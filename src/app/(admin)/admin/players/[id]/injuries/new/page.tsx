import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createInjury } from "../../../../injuries/actions";
import { playerName } from "@/lib/playerDisplay";

export default async function NewInjuryPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!player) return notFound();

  const createWithId = createInjury.bind(null, player.id);
  const today = new Date().toISOString().slice(0, 10);

  const inputStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 10,
    marginTop: 4,
  };

  return (
    <div className="form-page">
      <div style={{ maxWidth: 640, width: "100%", margin: "0 auto" }}>
        <Link
          href={`/admin/players/${player.id}/reports`}
          style={{ fontSize: "0.9rem", opacity: 0.7 }}
        >
          &larr; {playerName(player)}'s reports
        </Link>

        <h1
          className="display"
          style={{
            fontSize: "2.4rem",
            color: "var(--pitch)",
            marginTop: 12,
            marginBottom: 24,
          }}
        >
          LOG INJURY
        </h1>

        <form
          action={createWithId}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingBottom: 88,
          }}
        >
          <label style={{ fontSize: "0.9rem" }}>
            Injury type
            <input
              name="injuryType"
              required
              placeholder="e.g. Ankle sprain"
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: "0.9rem" }}>
            Date occurred
            <input
              name="dateOccurred"
              type="date"
              defaultValue={today}
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: "0.9rem" }}>
            Expected return date
            <input
              name="expectedReturnDate"
              type="date"
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: "0.9rem" }}>
            Description / notes
            <textarea
              name="description"
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
          </label>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--chalk)",
              paddingTop: 16,
              paddingBottom: 12,
              borderTop: "1px solid #e3ded2",
            }}
          >
            <button type="submit" className="button">
              Save injury
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}