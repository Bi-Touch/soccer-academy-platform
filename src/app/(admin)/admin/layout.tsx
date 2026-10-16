import Link from "next/link";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import { NavAutoClose } from "@/components/NavAutoClose";
import {
  Icon,
  ChevronIcon,
  SidebarToggleIcon,
  NAV_ICONS,
} from "@/components/NavIcons";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  COACH: "Coach",
  ADMIN: "Admin",
};

function NavGroup({
  id,
  label,
  icon,
  firstHref,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  firstHref: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-nav-group">
      <input
        type="checkbox"
        id={id}
        className="nav-group-checkbox"
        defaultChecked={id !== "group-operations"}
      />

      <div className="nav-group-header">
        <Link
          href={firstHref}
          title={label}
          aria-label={`Go to ${label}`}
          className="nav-group-icon-link"
        >
          <Icon size={17} className="admin-nav-icon">
            {icon}
          </Icon>
        </Link>

        <label htmlFor={id} className="nav-group-label-wrap">
          <span className="nav-group-label">{label}</span>
          <ChevronIcon />
        </label>
      </div>

      <div className="nav-group-content">
        <div className="nav-group-links">{children}</div>
      </div>
    </section>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="admin-nav-link">
      {children}
    </Link>
  );
}

function FooterLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} title={label} className="sidebar-footer-link">
      <Icon size={17} className="admin-nav-icon">
        {icon}
      </Icon>
      <span className="sidebar-footer-link-text">{label}</span>
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  return (
    <div className="admin-shell">
      <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />

      <label htmlFor="nav-toggle" className="nav-overlay" aria-hidden="true" />

      <input
        type="checkbox"
        id="sidebar-collapse"
        className="sidebar-collapse-checkbox"
      />

      <NavAutoClose />

      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <Link
            href="/admin"
            className="sidebar-brand"
            aria-label="KickOasis staff dashboard"
          >
            <img
              src="/images/KO_U13_Crest_Transparent.png"
              alt="KickOasis academy crest"
              className="sidebar-brand-logo"
            />
            <span className="sidebar-brand-name">KICKOASIS</span>
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

        <nav className="admin-nav" aria-label="Admin navigation">
          <NavGroup
            id="group-roster"
            label="Roster"
            icon={NAV_ICONS.users}
            firstHref={isAdmin ? "/admin/teams" : "/admin/players"}
          >
            {isAdmin && <NavLink href="/admin/teams">Teams</NavLink>}
            {isAdmin && <NavLink href="/admin/coaches">Coaches</NavLink>}
            <NavLink href="/admin/players">Players</NavLink>
            <NavLink href="/admin/players/compare">Compare Players</NavLink>
          </NavGroup>

          <NavGroup
            id="group-operations"
            label="Operations"
            icon={NAV_ICONS.calendar}
            firstHref="/admin/schedule"
          >
            <NavLink href="/admin/schedule">Schedule</NavLink>
            <NavLink href="/admin/training">Training Log</NavLink>
            <NavLink href="/admin/assessments">Assessments</NavLink>
            <NavLink href="/admin/physical-tests">Physical Tests</NavLink>
            <NavLink href="/admin/matches">Match Stats</NavLink>
            <NavLink href="/admin/injuries">Injuries</NavLink>
          </NavGroup>

          <NavGroup
            id="group-reports"
            label="Reports"
            icon={NAV_ICONS.barChart}
            firstHref="/admin/training/reports"
          >
            <NavLink href="/admin/training/reports">Training Reports</NavLink>
            <NavLink href="/admin/reports">Team Reports</NavLink>
            <NavLink href="/analytics">Analytics Dashboard</NavLink>
          </NavGroup>

          <NavGroup
            id="group-content"
            label="Content"
            icon={NAV_ICONS.image}
            firstHref={isAdmin ? "/admin/news" : "/admin/videos"}
          >
            {isAdmin && <NavLink href="/admin/news">News</NavLink>}
            <NavLink href="/admin/videos">Videos</NavLink>
            {isAdmin && <NavLink href="/admin/gallery">Gallery</NavLink>}
          </NavGroup>

          {isAdmin && (
            <NavGroup
              id="group-admin"
              label="Admin"
              icon={NAV_ICONS.shield}
              firstHref="/admin/registrations"
            >
              <NavLink href="/admin/registrations">Registrations</NavLink>
              <NavLink href="/admin/analysts">Analysts</NavLink>
              <NavLink href="/admin/enquiries">Enquiries</NavLink>
              <NavLink href="/admin/audit">Audit Log</NavLink>
            </NavGroup>
          )}

          <div className="sidebar-footer">
            <FooterLink
              href="/admin/guide"
              label="Data Collection Guide"
              icon={NAV_ICONS.book}
            />
          </div>
        </nav>
      </aside>

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
              photoUrl={null}
            />
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
