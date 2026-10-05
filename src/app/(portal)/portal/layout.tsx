import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/UserMenu";
import { MobileNavReset } from "@/components/MobileNavReset";
import { playerName } from "@/lib/playerDisplay";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  COACH: "Coach",
  ADMIN: "Admin",
};

const navLinkStyle = { textDecoration: "none", fontSize: "0.95rem" };
const subLinkStyle = { ...navLinkStyle, fontSize: "0.85rem" };
const groupLabelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(245, 243, 238, 0.5)",
};

function ChevronIcon() {
  return (
    <svg
      className="nav-group-chevron"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.5 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChildNavGroup({ id, name, playerId }: { id: string; name: string; playerId: string }) {
  return (
    <div>
      <input type="checkbox" id={id} className="nav-group-checkbox" />
      <label htmlFor={id} className="nav-group-header">
        <span style={groupLabelStyle}>{name}</span>
        <ChevronIcon />
      </label>
      <div className="nav-group-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 10, paddingLeft: 12 }}>
          <Link href={`/portal/parent/${playerId}/profile`} style={subLinkStyle}>Profile</Link>
          <Link href={`/portal/parent/${playerId}/stats`} style={subLinkStyle}>Stats</Link>
          <Link href={`/portal/parent/${playerId}/schedule`} style={subLinkStyle}>Schedule</Link>
          <Link href={`/portal/parent/${playerId}/consent`} style={subLinkStyle}>Consent</Link>
        </div>
      </div>
    </div>
  );
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  const player = session?.user?.id
    ? await prisma.player.findUnique({ where: { userId: session.user.id } })
    : null;

  const guardian =
    role === "PARENT" && session?.user?.id
      ? await prisma.parentGuardian.findUnique({
          where: { userId: session.user.id },
          include: { players: true },
        })
      : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <MobileNavReset>
        <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
        <label htmlFor="nav-toggle" className="nav-overlay" aria-hidden="true" />

        <aside className="admin-sidebar" style={{ background: "var(--pitch-dark)" }}>
          <div className="display sidebar-brand-text" style={{ fontSize: "1.4rem", marginBottom: 32 }}>ACADEMY</div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
            {role === "PARENT" ? (
              <>
                <Link href="/portal/parent" style={navLinkStyle}>My Children</Link>

                {guardian && guardian.players.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
                    {guardian.players.map((p) => (
                      <ChildNavGroup key={p.id} id={`child-${p.id}`} name={playerName(p)} playerId={p.id} />
                    ))}
                  </div>
                )}

                <Link href="/portal/settings" style={navLinkStyle}>Settings</Link>
              </>
            ) : (
              <>
                <Link href="/portal/dashboard" style={navLinkStyle}>Dashboard</Link>
                <Link href="/portal/profile" style={navLinkStyle}>My Profile</Link>
                <Link href="/portal/schedule" style={navLinkStyle}>Schedule</Link>
                <Link href="/portal/videos" style={navLinkStyle}>Videos</Link>
                <Link href="/portal/settings" style={navLinkStyle}>Settings</Link>
                <Link href="/portal/leaderboard" style={navLinkStyle}>Leaderboard</Link>
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