import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import { MobileNavReset } from "@/components/MobileNavReset";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  COACH: "Coach",
  ADMIN: "Admin",
};

const navLinkStyle = { textDecoration: "none", fontSize: "0.95rem" };
const groupLabelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(245, 243, 238, 0.5)",
};

function Icon({ path, viewBox = "0 0 24 24" }: { path: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.55, flexShrink: 0 }}
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
      style={{ opacity: 0.5 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const ICONS = {
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  barChart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
};

function NavGroup({ id, label, icon, children }: { id: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <input type="checkbox" id={id} className="nav-group-checkbox" />
      <label htmlFor={id} className="nav-group-header">
        <Icon path={icon} />
        <span style={groupLabelStyle}>{label}</span>
        <ChevronIcon />
      </label>
      <div className="nav-group-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 12, paddingLeft: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <MobileNavReset>
        <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
        <label htmlFor="nav-toggle" className="nav-overlay" aria-hidden="true" />

        <aside className="admin-sidebar">
          <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>STAFF</div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <NavGroup id="group-roster" label="Roster" icon={ICONS.users}>
              {isAdmin && <Link href="/admin/teams" style={navLinkStyle}>Teams</Link>}
              {isAdmin && <Link href="/admin/coaches" style={navLinkStyle}>Coaches</Link>}
              <Link href="/admin/players" style={navLinkStyle}>Players</Link>
            </NavGroup>

            <NavGroup id="group-operations" label="Operations" icon={ICONS.calendar}>
              <Link href="/admin/schedule" style={navLinkStyle}>Schedule</Link>
              <Link href="/admin/training" style={navLinkStyle}>Training Log</Link>
              <Link href="/admin/matches" style={navLinkStyle}>Match Stats</Link>
            </NavGroup>

            <NavGroup id="group-reports" label="Reports" icon={ICONS.barChart}>
              <Link href="/admin/training/reports" style={navLinkStyle}>Training Reports</Link>
              <Link href="/admin/reports" style={navLinkStyle}>Team Reports</Link>
            </NavGroup>

            <NavGroup id="group-content" label="Content" icon={ICONS.image}>
              {isAdmin && <Link href="/admin/news" style={navLinkStyle}>News</Link>}
              <Link href="/admin/videos" style={navLinkStyle}>Videos</Link>
              {isAdmin && <Link href="/admin/gallery" style={navLinkStyle}>Gallery</Link>}
            </NavGroup>

            {isAdmin && (
              <NavGroup id="group-admin" label="Admin" icon={ICONS.shield}>
                <Link href="/admin/enquiries" style={navLinkStyle}>Enquiries</Link>
              </NavGroup>
            )}

            <div style={{ paddingTop: 8, borderTop: "1px solid rgba(245, 243, 238, 0.14)" }}>
              <Link href="/portal/dashboard" style={{ ...navLinkStyle, opacity: 0.8 }}>
                &larr; Player Portal
              </Link>
            </div>
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
            <UserMenu name={session?.user?.name ?? ""} role={role ? ROLE_LABEL[role] : undefined} photoUrl={null} />
          </div>
        </header>

        <main className="admin-main" style={{ flex: 1, padding: 40, background: "var(--chalk)", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}