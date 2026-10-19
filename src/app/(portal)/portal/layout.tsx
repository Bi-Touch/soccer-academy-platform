import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/UserMenu";
import { NavAutoClose } from "@/components/NavAutoClose";
import {
  Icon,
  ChevronIcon,
  SidebarToggleIcon,
  NAV_ICONS,
} from "@/components/NavIcons";
import { playerName } from "@/lib/playerDisplay";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  PARENT: "Parent",
  COACH: "Coach",
  ADMIN: "Admin",
};

const CHILD_LINKS: [string, string][] = [
  ["profile", "Profile"],
  ["stats", "Stats"],
  ["reports", "Reports"],
  ["schedule", "Schedule"],
  ["consent", "Consent"],
  ["health", "Health"],
  ["videos", "Videos"],
  //["leaderboard", "Leaderboard"],
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase() || "?";
}

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="nav-item" title={label}>
      <span className="nav-item-icon">
        <Icon size={18}>{icon}</Icon>
      </span>
      <span className="nav-item-text">{label}</span>
    </Link>
  );
}

function ChildNavGroup({
  id,
  name,
  playerId,
}: {
  id: string;
  name: string;
  playerId: string;
}) {
  return (
    <section className="admin-nav-group">
      <input
        type="checkbox"
        id={id}
        className="nav-group-checkbox"
        defaultChecked={false}
      />

      <div className="nav-group-header">
        <Link
          href={`/portal/parent/${playerId}/profile`}
          title={name}
          aria-label={`Open ${name}'s profile`}
          className="nav-group-icon-link"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(245, 243, 238, 0.14)",
            color: "var(--chalk)",
            fontSize: "0.65rem",
            fontWeight: 700,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {initialsOf(name)}
        </Link>

        <label htmlFor={id} className="nav-group-label-wrap">
          <span className="nav-group-label">{name}</span>
          <ChevronIcon />
        </label>
      </div>

      <div className="nav-group-content">
        <div className="nav-group-links">
          {CHILD_LINKS.map(([slug, label]) => (
            <Link
              key={slug}
              href={`/portal/parent/${playerId}/${slug}`}
              className="admin-nav-link"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isParent = role === "PARENT";

  const player = session?.user?.id
    ? await prisma.player.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const guardian =
    isParent && session?.user?.id
      ? await prisma.parentGuardian.findUnique({
          where: { userId: session.user.id },
          include: { players: true },
        })
      : null;

  return (
    <div className="admin-shell">
      {/* Keep these controls as siblings of the sidebar. */}
      <input
        type="checkbox"
        id="nav-toggle"
        className="nav-toggle-checkbox"
      />

      <label
        htmlFor="nav-toggle"
        className="nav-overlay"
        aria-hidden="true"
      />

      <input
        type="checkbox"
        id="sidebar-collapse"
        className="sidebar-collapse-checkbox"
      />

      <NavAutoClose />

      <aside
        className="admin-sidebar"
        style={{ background: "var(--pitch-dark)" }}
      >
        {/* Sidebar branding and width toggle */}
        <div className="sidebar-top">
          <Link
            href={isParent ? "/portal/parent" : "/portal/dashboard"}
            className="sidebar-brand"
            aria-label="KickOasis portal home"
          >
            <img
              src="/images/KO_U13_Crest_Transparent.png"
              alt="KickOasis academy crest"
              className="sidebar-brand-logo"
            />

            <span className="sidebar-brand-name">
              KICKOASIS
            </span>
          </Link>

          <label
            htmlFor="sidebar-collapse"
            className="sidebar-toggle-label"
            title="Collapse or expand sidebar"
            aria-label="Toggle sidebar width"
          >
            <SidebarToggleIcon />
          </label>
        </div>

        {/* Portal navigation */}
        <nav className="admin-nav" aria-label="Portal navigation">
          {isParent ? (
            <>
              <NavItem
                href="/portal/parent"
                label="My Children"
                icon={NAV_ICONS.users}
              />

              {guardian?.players.map((child) => (
                <ChildNavGroup
                  key={child.id}
                  id={`child-${child.id}`}
                  name={playerName(child)}
                  playerId={child.id}
                />
              ))}

              <NavItem
                href="/portal/settings"
                label="Settings"
                icon={NAV_ICONS.sliders}
              />
            </>
          ) : (
            <>
              <NavItem
                href="/portal/dashboard"
                label="Dashboard"
                icon={NAV_ICONS.home}
              />

              <NavItem
                href="/portal/profile"
                label="My Profile"
                icon={NAV_ICONS.user}
              />

              <NavItem
                href="/portal/schedule"
                label="Schedule"
                icon={NAV_ICONS.calendar}
              />

              <NavItem
                href="/portal/videos"
                label="Videos"
                icon={NAV_ICONS.play}
              />

              <NavItem
                href="/portal/settings"
                label="Settings"
                icon={NAV_ICONS.sliders}
              />
              {/*
              <NavItem
                href="/portal/leaderboard"
                label="Leaderboard"
                icon={NAV_ICONS.trophy}
              />
              */}
            </>
          )}
        </nav>
      </aside>

      {/* Main content and header */}
      <div className="admin-content-shell">
        <header className="admin-header">
          <label
            htmlFor="nav-toggle"
            className="nav-toggle-label"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <span aria-hidden="true">&#9776;</span>
          </label>

          <div className="admin-header-user">
            <UserMenu
              name={session?.user?.name ?? ""}
              role={role ? ROLE_LABEL[role] ?? role : undefined}
              photoUrl={player?.photoUrl ?? null}
            />
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
