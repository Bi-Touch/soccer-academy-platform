
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { playerName } from "@/lib/playerDisplay";

type Props = {
  children: React.ReactNode;
  params: { id: string };
};

const tabs = [
  { label: "Profile", path: "profile" },
  { label: "Stats", path: "stats" },
  { label: "Reports", path: "reports" },
  { label: "Schedule", path: "schedule" },
  { label: "Consent", path: "consent" },
  { label: "Videos", path: "videos" },
];

export default async function ParentChildLayout({
  children,
  params,
}: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const guardian = await prisma.parentGuardian.findUnique({
    where: { userId: session.user.id },
    include: {
      players: {
        where: { id: params.id },
        include: { team: true },
      },
    },
  });

  const player = guardian?.players[0];

  if (!player) {
    notFound();
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 40px" }}>
      <Link
        href="/portal/parent"
        style={{
          fontSize: "0.85rem",
          color: "var(--muted, #777)",
          textDecoration: "none",
        }}
      >
        ← My Children
      </Link>

      <div style={{ marginTop: 12, marginBottom: 24 }}>
        <h1
          className="display"
          style={{
            margin: 0,
            fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
            color: "var(--pitch)",
          }}
        >
          {playerName(player)}
        </h1>

        <p style={{ margin: "5px 0 0", opacity: 0.7, fontSize: "0.9rem" }}>
          {player.team?.name ?? "Team not assigned"} · My Children
        </p>
      </div>

      <nav
        aria-label="Child navigation"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          marginBottom: 28,
          borderBottom: "1px solid #e3ded2",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={`/portal/parent/${player.id}/${tab.path}`}
            style={{
              flex: "0 0 auto",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--pitch)",
              background:
                tab.path === "videos" ? "#eaf0e8" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}