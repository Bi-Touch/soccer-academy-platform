import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";

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
      <aside style={{ width: 220, background: "var(--ink)", color: "var(--chalk)", padding: 24, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>STAFF</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
          {isAdmin && <Link href="/admin/teams" style={{ textDecoration: "none" }}>Teams</Link>}
          {isAdmin && <Link href="/admin/coaches" style={{ textDecoration: "none" }}>Coaches</Link>}
          <Link href="/admin/players" style={{ textDecoration: "none" }}>Players</Link>
          <Link href="/admin/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
          <Link href="/admin/training" style={{ textDecoration: "none" }}>Training Log</Link>
          <Link href="/admin/training/reports" style={{ textDecoration: "none" }}>Training Reports</Link>
          {isAdmin && <Link href="/admin/news" style={{ textDecoration: "none" }}>News</Link>}
          <Link href="/admin/videos" style={{ textDecoration: "none" }}>Videos</Link>
          {isAdmin && <Link href="/admin/gallery" style={{ textDecoration: "none" }}>Gallery</Link>}
          {isAdmin && <Link href="/admin/enquiries" style={{ textDecoration: "none" }}>Enquiries</Link>}
          <Link href="/portal/dashboard" style={{ textDecoration: "none", opacity: 0.8 }}>&larr; Player Portal</Link>
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
          <UserMenu name={session?.user?.name ?? ""} role={role ? ROLE_LABEL[role] : undefined} photoUrl={null} />
        </header>

        <main style={{ flex: 1, padding: 40, background: "var(--chalk)" }}>{children}</main>
      </div>
    </div>
  );
}