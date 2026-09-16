import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--pitch-dark)", color: "var(--chalk)", marginTop: "auto" }}>
      <div
        className="container"
        style={{
          padding: "40px 24px",
          fontSize: "0.9rem",
          opacity: 0.8,
          //borderTop: "1px solid rgba(245,243,238,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>© {new Date().getFullYear()} Academy. Building tomorrow's players.</span>
        <Link href="/privacy-policy" style={{ textDecoration: "none", opacity: 0.85 }}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}