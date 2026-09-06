import Link from "next/link";

export function SiteHeader() {
  return (
    <header style={{ background: "var(--pitch)", color: "var(--chalk)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px" }}>
        <Link href="/" className="display" style={{ fontSize: "1.6rem", color: "var(--chalk)", textDecoration: "none" }}>
          ACADEMY
        </Link>
        <nav style={{ display: "flex", gap: 28, fontSize: "0.95rem" }}>
          <Link href="/about" style={{ textDecoration: "none" }}>About</Link>
          <Link href="/teams" style={{ textDecoration: "none" }}>Teams</Link>
          <Link href="/news" style={{ textDecoration: "none" }}>News</Link>
          <Link href="/contact" style={{ textDecoration: "none" }}>Contact</Link>
          <Link href="/login" className="button">Player Login</Link>
        </nav>
      </div>
    </header>
  );
}
