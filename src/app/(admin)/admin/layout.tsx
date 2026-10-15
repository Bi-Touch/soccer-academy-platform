
import Link from "next/link";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import { NavAutoClose } from "@/components/NavAutoClose";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  COACH: "Coach",
  ADMIN: "Admin",
};

function Icon({ path }: { path: ReactNode }) {
  return (
    <svg
      className="admin-nav-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

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
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="14 18 8 12 14 6" />
    </svg>
  );
}

const ICONS = {
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  barChart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
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
          <Icon path={icon} />
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

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
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
      <Icon path={icon} />
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
            icon={ICONS.users}
            firstHref={isAdmin ? "/admin/teams" : "/admin/players"}
          >
            {isAdmin && <NavLink href="/admin/teams">Teams</NavLink>}
            {isAdmin && <NavLink href="/admin/coaches">Coaches</NavLink>}
            <NavLink href="/admin/players">Players</NavLink>
            <NavLink href="/admin/players/compare">
              Compare Players
            </NavLink>
          </NavGroup>

          <NavGroup
            id="group-operations"
            label="Operations"
            icon={ICONS.calendar}
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
            icon={ICONS.barChart}
            firstHref="/admin/training/reports"
          >
            <NavLink href="/admin/training/reports">
              Training Reports
            </NavLink>
            <NavLink href="/admin/reports">Team Reports</NavLink>
            <NavLink href="/analytics">Analytics Dashboard</NavLink>
          </NavGroup>

          <NavGroup
            id="group-content"
            label="Content"
            icon={ICONS.image}
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
              icon={ICONS.shield}
              firstHref="/admin/registrations"
            >
              <NavLink href="/admin/registrations">
                Registrations
              </NavLink>
              <NavLink href="/admin/analysts">Analysts</NavLink>
              <NavLink href="/admin/enquiries">Enquiries</NavLink>
            </NavGroup>
          )}

          <div className="sidebar-footer">
            <FooterLink
              href="/admin/guide"
              label="Data Collection Guide"
              icon={ICONS.book}
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