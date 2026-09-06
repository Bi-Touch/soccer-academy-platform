export function SiteFooter() {
  return (
    <footer style={{ background: "var(--pitch-dark)", color: "var(--chalk)", marginTop: 80 }}>
      <div className="container" style={{ padding: "40px 24px", fontSize: "0.9rem", opacity: 0.8 }}>
        © {new Date().getFullYear()} Academy. Building tomorrow's players.
      </div>
    </footer>
  );
}
