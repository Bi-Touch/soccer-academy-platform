import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/UserMenu";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  COACH: "Coach",
  ADMIN: "Admin",
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  const player = session?.user?.id
    ? await prisma.player.findUnique({ where: { userId: session.user.id } })
    : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "var(--pitch-dark)", color: "var(--chalk)", padding: 24, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>ACADEMY</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
          <Link href="/portal/dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>
          <Link href="/portal/profile" style={{ textDecoration: "none" }}>My Profile</Link>
          <Link href="/portal/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
          <Link href="/portal/videos" style={{ textDecoration: "none" }}>Videos</Link>
          <Link href="/portal/settings" style={{ textDecoration: "none" }}>Settings</Link>
          <Link href="/portal/leaderboard" style={{ textDecoration: "none" }}>Leaderboard</Link>
          {(role === "ADMIN" || role === "COACH") && (
            <Link href="/admin/players" style={{ textDecoration: "none", opacity: 0.8 }}>&larr; Staff Admin</Link>
          )}
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "14px 40px",
            borderBottom: "1px solid #e3ded2",
            background: "white",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <UserMenu
            name={session?.user?.name ?? ""}
            role={role ? ROLE_LABEL[role] : undefined}
            photoUrl={player?.photoUrl}
          />
        </header>

        <main style={{ flex: 1, padding: 40, background: "var(--chalk)" }}>{children}</main>
      </div>
    </div>
  );
}