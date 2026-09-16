import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Reveal } from "@/components/Reveal";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { prisma } from "@/lib/prisma";

const VALUES = [
  { title: "Discipline", body: "Structured sessions and consistent standards, on and off the ball." },
  { title: "Skill Development", body: "A clear technical curriculum that builds from first touch to match intelligence." },
  { title: "Teamwork", body: "Players learn to compete for each other, not just for themselves." },
  { title: "Character", body: "Respect, resilience, and accountability woven into every training session." },
  { title: "Community", body: "A home for players and families that lasts well beyond the final whistle." },
];

const JOURNEY_COLORS = ["var(--floodlight)", "var(--pitch)", "var(--card-red)", "var(--pitch-dark)"];

const JOURNEY = [
  { year: "2016", title: "The Beginning", body: "The academy opens with a single squad and a borrowed pitch." },
  { year: "2018", title: "First Campus", body: "A dedicated training ground opens, built for year-round coaching." },
  { year: "2020", title: "Four Squads", body: "Age-group teams expand from U9 through U17." },
  { year: "2022", title: "100th Graduate", body: "The academy's first wave of players moves into senior football." },
  { year: "2024", title: "Second Campus", body: "A second site opens to meet growing demand across the city." },
  { year: "2026", title: "Where We Are Today", body: "Multiple campuses, a full coaching staff, and a growing alumni network." },
];

const TESTIMONIALS = [
  {
    quote: "My son has grown so much as a player and as a person since joining. The coaches genuinely care about development, not just winning.",
    name: "Parent of a U13 player",
  },
  {
    quote: "The structure here is what sets it apart — every session has a purpose. I always know what my daughter is working on and why.",
    name: "Parent of a U15 player",
  },
  {
    quote: "I trained here for four years before moving into the senior setup. The habits I built on this pitch are still with me today.",
    name: "Academy alumnus",
  },
];

export default async function AboutPage() {
  const coaches = await prisma.coach.findMany({
    include: { user: true },
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
            "linear-gradient(rgba(15,61,46,0.45), rgba(10,42,32,0.6)), url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1600&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", opacity: 0.8, textTransform: "uppercase" }}>
            About the Academy
          </p>
          <h1 className="display" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", maxWidth: 780, marginTop: 12, textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}>
            WE EXIST TO DEVELOP THE NEXT GENERATION OF PLAYERS
          </h1>
          <p style={{ maxWidth: 560, marginTop: 24, fontSize: "1.15rem", opacity: 0.95, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
            Since 2016, the academy has built a structured pathway for young players to develop
            technically, physically, and personally — on and off the pitch.
          </p>
          <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.8 }}>Est. 2016 &middot; Nairobi, Kenya</p>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid #e3ded2" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "32px 24px", gap: 24 }}>
          {[
            ["10", "Years running"],
            ["6", "Squads"],
            ["120+", "Players"],
            ["4", "Campuses"],
          ].map(([num, label], i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="stat-number display" style={{ fontSize: "2.2rem", color: "var(--pitch)" }}>
                <AnimatedNumber value={num} />
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "72px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ position: "relative", aspectRatio: "4/3", width: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80"
              alt="Players training at the academy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
              Our Story
            </p>
            <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 20 }}>
              FROM ONE SQUAD TO A FULL ACADEMY
            </h2>
            <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
              Replace this paragraph with your academy's real founding story — who started it, why,
              and what the first year looked like.
            </p>
            <p style={{ lineHeight: 1.7 }}>
              Add a second paragraph on how the academy grew — new campuses, age groups, or coaching
              staff added over time.
            </p>
            <blockquote
              style={{
                borderLeft: "4px solid var(--floodlight)",
                paddingLeft: 20,
                marginTop: 28,
                fontStyle: "italic",
                color: "var(--pitch)",
              }}
            >
              &ldquo;Replace this with a real quote from a founder or head coach about why the academy exists.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      <section style={{ background: "white", padding: "72px 24px" }}>
        <div className="container">
          <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
            Mission and Values
          </p>
          <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 40 }}>
            WHAT DRIVES US
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
            {VALUES.map((v) => (
              <div key={v.title} className="news-card" style={{ borderTop: "3px solid var(--floodlight)", padding: "12px 16px 16px" }}>
                <h3 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)" }}>
                  {v.title.toUpperCase()}
                </h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 6, lineHeight: 1.6 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR JOURNEY */}
      <section className="container" style={{ padding: "72px 24px" }}>
        <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
          Our Journey
        </p>
        <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 40 }}>
          10 YEARS OF BUILDING PLAYERS
        </h2>

        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", position: "relative", height: 280, minWidth: "max-content" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#e3ded2" }} />

            {JOURNEY.map((j, i) => {
              const color = JOURNEY_COLORS[i % JOURNEY_COLORS.length];
              const isAbove = i % 2 === 0;
              return (
                <div
                  key={j.year}
                  style={{
                    width: 230,
                    flexShrink: 0,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: isAbove ? "flex-end" : "flex-start",
                    height: "100%",
                    padding: "0 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      width: 2,
                      height: 24,
                      background: "#e3ded2",
                      transform: "translateX(-50%)",
                      top: isAbove ? undefined : "50%",
                      bottom: isAbove ? "50%" : undefined,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color,
                      border: "3px solid var(--chalk)",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1,
                    }}
                  />
                  <div style={{ paddingBottom: isAbove ? 28 : 0, paddingTop: isAbove ? 0 : 28 }}>
                    <div className="display" style={{ fontSize: "1.3rem", color }}>{j.year}</div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginTop: 4 }}>{j.title}</h3>
                    <p style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 4 }}>{j.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {coaches.length > 0 && (
        <section style={{ background: "white", padding: "72px 24px" }}>
          <div className="container">
            <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
              Coaching Staff
            </p>
            <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 40 }}>
              LED BY PEOPLE WHO'VE BEEN THERE
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32 }}>
              {coaches.map((coach) => (
                <div key={coach.id}>
                  <PlayerAvatar src={coach.photoUrl} alt={coach.user.name} size={90} rounded />
                  <h3 className="display" style={{ fontSize: "1.1rem", color: "var(--pitch)", marginTop: 12 }}>
                    {coach.user.name}
                  </h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>{coach.title ?? "Coach"}</p>
                </div>
              ))}
            </div>
            <Link href="/coaches" style={{ display: "inline-block", marginTop: 32, fontSize: "0.9rem" }}>
              Meet the full coaching staff &rarr;
            </Link>
          </div>
        </section>
      )}

      <TestimonialsCarousel
        eyebrow="Testimonials"
        title="WHAT FAMILIES SAY"
        testimonials={TESTIMONIALS.map((t) => ({ quote: t.quote, role: t.name }))}
      />

      <section style={{ background: "var(--pitch)", color: "var(--chalk)", padding: "64px 24px", textAlign: "center" }}>
        <div className="container">
          <h2 className="display" style={{ fontSize: "2rem" }}>READY TO JOIN THE ACADEMY?</h2>
          <p style={{ marginTop: 12, opacity: 0.85, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Trials run throughout the year across all age groups. Get in touch to find out what's next.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" className="button">Contact Us</Link>
            <Link href="/fixtures" className="button secondary">See Fixtures</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}