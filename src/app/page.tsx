import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <section style={{ background: "var(--pitch)", color: "var(--chalk)", padding: "100px 0 80px" }}>
        <div className="container">
          <h1 className="display" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", maxWidth: 780 }}>
            WHERE THE NEXT GENERATION LEARNS THE GAME
          </h1>
          <p style={{ maxWidth: 520, marginTop: 24, fontSize: "1.15rem", opacity: 0.85 }}>
            Training, matches and player development — one home for every squad in the academy.
          </p>
          <div style={{ marginTop: 36, display: "flex", gap: 16 }}>
            <Link href="/teams" className="button">See our teams</Link>
            <Link href="/login" className="button secondary">Player login</Link>
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid #e3ded2" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "32px 24px", gap: 24 }}>
          {[
            ["6", "Squads"],
            ["120+", "Players"],
            ["18", "Coaches"],
            ["4", "Campuses"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="display" style={{ fontSize: "2.5rem", color: "var(--pitch)" }}>{num}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "72px 24px" }}>
        <h2 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 24 }}>
          LATEST FROM THE ACADEMY
        </h2>
        <p style={{ maxWidth: 560, opacity: 0.75 }}>
          Match reports, signings and academy news will appear here — wired up to the NewsPost
          model once content is added.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}
