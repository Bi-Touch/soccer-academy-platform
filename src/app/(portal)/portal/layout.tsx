import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/UserMenu";
import { NavAutoClose } from "@/components/NavAutoClose";
import { Icon, ChevronIcon, SidebarToggleIcon, NAV_ICONS } from "@/components/NavIcons";
import { playerName } from "@/lib/playerDisplay";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  PARENT: "Parent",
  COACH: "Coach",
  ADMIN: "Admin",
};

const groupLabelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(245, 243, 238, 0.5)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
};

const subLinkStyle: React.CSSProperties = { textDecoration: "none", fontSize: "0.85rem" };

const CHILD_LINKS: [string, string][] = [
  ["profile", "Profile"],
  ["stats", "Stats"],
  ["reports", "Reports"],
  ["schedule", "Schedule"],
  ["consent", "Consent"],
  ["videos", "Videos"],
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function NavItem({ href, label, icon, muted = false }: { href: string; label: string; icon: React.ReactNode; muted?: boolean }) {
  return (
    <Link href={href} className="nav-item" title={label} style={muted ? { opacity: 0.8 } : undefined}>
      <span className="nav-item-icon">
        <Icon size={18}>{icon}</Icon>
      </span>
      <span className="nav-item-text">{label}</span>
    </Link>
  );
}

function ChildNavGroup({ id, name, playerId }: { id: string; name: string; playerId: string }) {
  return (
    <div>
      <input type="checkbox" id={id} className="nav-group-checkbox" />
      <div className="nav-group-header">
        <Link
          href={`/portal/parent/${playerId}/profile`}
          title={name}
          aria-label={`Open ${name}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(245, 243, 238, 0.14)",
            color: "var(--chalk)",
            fontSize: "0.6rem",
            fontWeight: 700,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {initialsOf(name)}
        </Link>
        <label htmlFor={id} className="nav-group-label-wrap">
          <span style={groupLabelStyle}>{name}</span>
          <ChevronIcon />
        </label>
      </div>
      <div className="nav-group-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 10, paddingLeft: 34 }}>
          {CHILD_LINKS.map(([slug, label]) => (
            <Link key={slug} href={`/portal/parent/${playerId}/${slug}`} style={subLinkStyle}>
              {label}
            </Link>
          ))}
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
      {/* These four must stay direct siblings of the sidebar: the CSS reaches it with the ~ selector. */}
      <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
      <label htmlFor="nav-toggle" className="nav-overlay" aria-hidden="true" />
      <input type="checkbox" id="sidebar-collapse" className="sidebar-collapse-checkbox" />
      <NavAutoClose />

      <aside className="admin-sidebar" style={{ background: "var(--pitch-dark)" }}>
        <label htmlFor="sidebar-collapse" className="sidebar-toggle-label" aria-label="Toggle sidebar width">
          <SidebarToggleIcon />
        </label>

        <div className="display sidebar-brand-text" style={{ fontSize: "1.4rem", marginBottom: 32 }}>ACADEMY</div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {role === "PARENT" ? (
            <>
              <NavItem href="/portal/parent" label="My Children" icon={NAV_ICONS.users} />

              {guardian?.players.map((p) => (
                <ChildNavGroup key={p.id} id={`child-${p.id}`} name={playerName(p)} playerId={p.id} />
              ))}

              <NavItem href="/portal/settings" label="Settings" icon={NAV_ICONS.sliders} />
            </>
          ) : (
            <>
              <NavItem href="/portal/dashboard" label="Dashboard" icon={NAV_ICONS.home} />
              <NavItem href="/portal/profile" label="My Profile" icon={NAV_ICONS.user} />
              <NavItem href="/portal/schedule" label="Schedule" icon={NAV_ICONS.calendar} />
              <NavItem href="/portal/videos" label="Videos" icon={NAV_ICONS.play} />
              <NavItem href="/portal/settings" label="Settings" icon={NAV_ICONS.sliders} />
              <NavItem href="/portal/leaderboard" label="Leaderboard" icon={NAV_ICONS.trophy} />
            </>
          )}

          {(role === "ADMIN" || role === "COACH") && (
            <NavItem href="/admin/players" label="Staff Admin" icon={NAV_ICONS.arrowLeft} muted />
          )}
        </nav>
      </aside>

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