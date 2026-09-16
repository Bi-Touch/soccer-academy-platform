import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { prisma } from "@/lib/prisma";

const WHY_US = [
  {
    title: "Structured Pathway",
    body: "A clear progression from U9 through to senior football, not just scattered training sessions.",
    icon: (
      <path d="M4 19V6a2 2 0 0 1 2-2h10l4 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 9h6 M9 13h6 M9 17h3" />
    ),
  },
  {
    title: "Qualified Coaches",
    body: "Every session is led by experienced, vetted coaching staff — not volunteers learning on the job.",
    icon: (
      <path d="M12 3l8 4-8 4-8-4 8-4Z M4 11v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4" />
    ),
  },
  {
    title: "Multiple Campuses",
    body: "Convenient training locations across the city, so distance is never the reason to miss a session.",
    icon: (
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    ),
  },
  {
    title: "Proven Track Record",
    body: "A decade of developing players, with real alumni who've moved on to senior football.",
    icon: (
      <path d="M8 21h8 M12 17v4 M7 4h10v4a5 5 0 0 1-10 0V4Z M7 6H4a3 3 0 0 0 3 5 M17 6h3a3 3 0 0 1-3 5" />
    ),
  },
];

export default async function HomePage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <>
      <SiteHeader />

      <section
        style={{
          color: "var(--chalk)",
          padding: "100px 0 80px",
          backgroundImage:
            "linear-gradient(rgba(15,61,46,0.45), rgba(10,42,32,0.6)), url('https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=1600&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container">
          <h1 className="display" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", maxWidth: 780, textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}>
            WHERE THE NEXT GENERATION LEARNS THE GAME
          </h1>
          <p style={{ maxWidth: 520, marginTop: 24, fontSize: "1.15rem", opacity: 0.95, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
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
          ].map(([num, label], i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="stat-number display" style={{ fontSize: "2.5rem", color: "var(--pitch)" }}>
                <AnimatedNumber value={num} />
              </div>
              <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>{label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "72px 24px" }}>
        <h2 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 24 }}>
          LATEST FROM THE ACADEMY
        </h2>

        {posts.length === 0 ? (
          <p style={{ maxWidth: 560, opacity: 0.75 }}>
            Match reports, signings and academy news will appear here once posts are published.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 100}>
                <Link href={`/news/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="news-card" style={{ borderTop: "3px solid var(--floodlight)", paddingTop: 12, padding: "12px 16px 16px" }}>
                    <h3 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)" }}>{post.title}</h3>
                    <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 6 }}>{post.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <Link href="/news" style={{ display: "inline-block", marginTop: 32, fontSize: "0.9rem" }}>
            See all news &rarr;
          </Link>
        )}
      </section>

      <section style={{ background: "white", padding: "72px 24px", borderTop: "1px solid #e3ded2" }}>
        <div className="container">
          <h2 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 40 }}>
            WHY FAMILIES CHOOSE US
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
            {WHY_US.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--floodlight)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                <h3 className="display" style={{ fontSize: "1.15rem", color: "var(--pitch)", marginTop: 14 }}>
                  {item.title.toUpperCase()}
                </h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 8, lineHeight: 1.6 }}>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}