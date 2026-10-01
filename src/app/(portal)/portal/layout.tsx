import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/UserMenu";
import { MobileNavReset } from "@/components/MobileNavReset";

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
      <MobileNavReset>
        <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
        <label htmlFor="nav-toggle" className="nav-overlay" aria-hidden="true" />

        <aside className="admin-sidebar" style={{ background: "var(--pitch-dark)" }}>
          <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>ACADEMY</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
            
            {role === "PARENT" ? (
              <>
                <Link href="/portal/parent" style={{ textDecoration: "none" }}>My Children</Link>
                <Link href="/portal/settings" style={{ textDecoration: "none" }}>Settings</Link>
              </>
            ) : (
              <>
                <Link href="/portal/dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>
                <Link href="/portal/profile" style={{ textDecoration: "none" }}>My Profile</Link>
                <Link href="/portal/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
                <Link href="/portal/videos" style={{ textDecoration: "none" }}>Videos</Link>
                <Link href="/portal/settings" style={{ textDecoration: "none" }}>Settings</Link>
                <Link href="/portal/leaderboard" style={{ textDecoration: "none" }}>Leaderboard</Link>
              </>
            )}
            {(role === "ADMIN" || role === "COACH") && (
              <Link href="/admin/players" style={{ textDecoration: "none", opacity: 0.8 }}>&larr; Staff Admin</Link>
            )}
          </nav>
        </aside>
      </MobileNavReset>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="admin-header"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "14px 40px",
            borderBottom: "1px solid #e3ded2",
            background: "white",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Toggle menu">
            &#9776;
          </label>
          <div style={{ marginLeft: "auto" }}>
            <UserMenu
              name={session?.user?.name ?? ""}
              role={role ? ROLE_LABEL[role] : undefined}
              photoUrl={player?.photoUrl}
            />
          </div>
        </header>

        <main className="admin-main" style={{ flex: 1, padding: 40, background: "var(--chalk)", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}