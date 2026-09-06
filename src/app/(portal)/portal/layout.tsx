import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "var(--pitch-dark)", color: "var(--chalk)", padding: 24 }}>
        <div className="display" style={{ fontSize: "1.4rem", marginBottom: 32 }}>ACADEMY</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: "0.95rem" }}>
          <Link href="/portal/dashboard" style={{ textDecoration: "none" }}>Dashboard</Link>
          <Link href="/portal/profile" style={{ textDecoration: "none" }}>My Profile</Link>
          <Link href="/portal/schedule" style={{ textDecoration: "none" }}>Schedule</Link>
          <Link href="/portal/videos" style={{ textDecoration: "none" }}>Videos</Link>
        </nav>
        <div style={{ marginTop: 48, fontSize: "0.85rem", opacity: 0.7 }}>
          Signed in as {session?.user?.name}
        </div>
      </aside>
      <main style={{ flex: 1, padding: 40, background: "var(--chalk)" }}>{children}</main>
    </div>
  );
}
