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
          <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
            {isAdmin && <Link href="/admin/teams" style={{ textDecoration: "none" }}>Teams</Link>}
            {isAdmin && <Link href="/admin/coaches" style={{ textDecoration: "none" }}>Coaches</Link>}
            <Link href="/admin/players" style={{ textDecoration: "none" }}>Players</Link>
            <Link href="/admin/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
            <Link href="/admin/training" style={{ textDecoration: "none" }}>Training Log</Link>
            <Link href="/admin/matches" style={{ textDecoration: "none" }}>Match Stats</Link>
            <Link href="/admin/training/reports" style={{ textDecoration: "none" }}>Training Reports</Link>
            {isAdmin && <Link href="/admin/news" style={{ textDecoration: "none" }}>News</Link>}
            <Link href="/admin/videos" style={{ textDecoration: "none" }}>Videos</Link>
            {isAdmin && <Link href="/admin/gallery" style={{ textDecoration: "none" }}>Gallery</Link>}
            {isAdmin && <Link href="/admin/enquiries" style={{ textDecoration: "none" }}>Enquiries</Link>}
            <Link href="/portal/dashboard" style={{ textDecoration: "none", opacity: 0.8 }}>&larr; Player Portal</Link>
          </nav>
        </aside>
      </MobileNavReset>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="admin-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
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
          <UserMenu name={session?.user?.name ?? ""} role={role ? ROLE_LABEL[role] : undefined} photoUrl={null} />
        </header>

        <main className="admin-main" style={{ flex: 1, padding: 40, background: "var(--chalk)", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}