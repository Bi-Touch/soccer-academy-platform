import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "var(--ink)", color: "var(--chalk)", padding: 24 }}>
        <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>STAFF</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
          <Link href="/admin/players" style={{ textDecoration: "none" }}>Players</Link>
          <Link href="/admin/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 40, background: "var(--chalk)" }}>{children}</main>
    </div>
  );
}
