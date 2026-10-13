import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/permissions";
import { UserMenu } from "@/components/UserMenu";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", COACH: "Coach", ANALYST: "Analyst" };

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  // Checks the database, not just the cookie.
  const user = await getSessionUser();
  if (!user || !(user.role === "ADMIN" || user.role === "COACH" || user.role === "ANALYST")) {
    redirect("/login");
  }

  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--chalk)" }}>
      <header
        className="analytics-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "white",
          borderBottom: "1px solid #e3ded2",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span className="display" style={{ fontSize: "1.4rem", color: "var(--pitch)" }}>ACADEMY ANALYTICS</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "#e7f3ed", color: "var(--pitch)", padding: "3px 10px", borderRadius: 999 }}>
          VIEW ONLY
        </span>
        {(user.role === "ADMIN" || user.role === "COACH") && (
          <Link href="/admin/players" style={{ fontSize: "0.85rem", opacity: 0.7 }}>&larr; Staff admin</Link>
        )}
        <div style={{ marginLeft: "auto" }}>
          <UserMenu name={name} role={ROLE_LABEL[user.role]} photoUrl={null} />
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 60px" }}>{children}</main>
    </div>
  );
}