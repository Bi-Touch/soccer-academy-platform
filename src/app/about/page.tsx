import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Reveal } from "@/components/Reveal";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { prisma } from "@/lib/prisma";

const JOURNEY_COLORS = ["var(--floodlight)", "var(--pitch)", "var(--card-red)", "var(--pitch-dark)"];

const JOURNEY = [
  { year: "2024", title: "Personalised Beginnings", body: "What is now the academy began as individual and small-group coaching sessions." },
  { year: "2024", title: "The Academy Takes Shape", body: "A small coaching team comes together, and the academy is formally established." },
  { year: "2026", title: "Where We Are Today", body: "Structured squads alongside personalised coaching, with eyes on what's next for every player." },
];

const VALUES = [
  { title: "Discipline", body: "Structured sessions and consistent standards, on and off the ball." },
  { title: "Skill Development", body: "A clear technical curriculum that builds from first touch to match intelligence." },
  { title: "Teamwork", body: "Players learn to compete for each other, not just for themselves." },
  { title: "Character", body: "Respect, resilience, and accountability woven into every training session." },
  { title: "Community", body: "A home for players and families that lasts well beyond the final whistle." },
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

      {/* HERO */}
      <section
        style={{
          color: "var(--chalk)",
          padding: "90px 0 60px",
          backgroundImage:
            "linear-gradient(rgba(15,61,46,0.55), rgba(10,42,32,0.75)), url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1600&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", opacity: 0.8, textTransform: "uppercase" }}>
            About the Academy
          </p>
          <h1 className="display" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", maxWidth: 780, marginTop: 12, textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
            WE EXIST TO DEVELOP THE NEXT GENERATION OF PLAYERS
          </h1>
          <p style={{ maxWidth: 560, marginTop: 20, fontSize: "1.05rem", opacity: 0.9 }}>
            What began as one-on-one coaching has grown into a structured academy — without losing
            the individual attention players started with.
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ borderBottom: "1px solid #e3ded2" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "32px 24px", gap: 24 }}>
          {[
            ["2", "Years running"],
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

      {/* OUR STORY */}
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
              FROM ONE-ON-ONE COACHING TO A FULL ACADEMY
            </h2>
            <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
              It started small — one coach, individual sessions, and a handful of committed players
              who wanted more than standard group training could offer. That hands-on, personalised
              approach became the foundation everything else was built on.
            </p>
            <p style={{ lineHeight: 1.7 }}>
              As more families saw the difference focused, individual coaching made, a small team
              came together, and in 2024 the academy took shape — built to bring that same personal
              philosophy to structured squads, from U9 to U17.
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
              &ldquo;What we built started as one-on-one sessions — today it's a full academy, but we
              never lost that personal attention.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section style={{ background: "white", padding: "72px 24px" }}>
        <div className="container">
          <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
            What We Offer
          </p>
          <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 32 }}>
            TWO WAYS TO TRAIN WITH US
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            <div className="news-card" style={{ borderTop: "3px solid var(--floodlight)", padding: "16px 20px 20px" }}>
              <h3 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)" }}>ACADEMY SQUADS</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 10, lineHeight: 1.6 }}>
                Structured, age-group team training from U9 through U17 — the full academy
                curriculum, built around our coaching philosophy and development framework.
              </p>
            </div>
            <div className="news-card" style={{ borderTop: "3px solid var(--floodlight)", padding: "16px 20px 20px" }}>
              <h3 className="display" style={{ fontSize: "1.3rem", color: "var(--pitch)" }}>PERSONALISED COACHING</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 10, lineHeight: 1.6 }}>
                Customised one-on-one or small-group sessions for players and clients who want
                individual focus outside the team structure — the same approach the academy started with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION AND VALUES */}
      <section className="container" style={{ padding: "72px 24px" }}>
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
      </section>

      {/* OUR JOURNEY */}
      <section style={{ background: "white", padding: "72px 24px" }}>
        <div className="container">
          <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
            Our Journey
          </p>
          <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 40 }}>
            FROM INDIVIDUAL SESSIONS TO A FULL ACADEMY
          </h2>

          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${JOURNEY.length}, minmax(220px, 1fr))`,
                gap: 32,
                justifyContent: "center",
                position: "relative",
                minWidth: JOURNEY.length * 220,
                height: 300,
              }}
            >
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#e3ded2" }} />

              {JOURNEY.map((j, i) => {
                const color = JOURNEY_COLORS[i % JOURNEY_COLORS.length];
                const isAbove = i % 2 === 0;
                return (
                  <div
                    key={`${j.year}-${j.title}`}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: isAbove ? "flex-end" : "flex-start",
                      height: "100%",
                      padding: "0 8px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        width: 2,
                        height: 32,
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
                    <div style={{ paddingBottom: isAbove ? 40 : 0, paddingTop: isAbove ? 0 : 40 }}>
                      <div className="display" style={{ fontSize: "1.3rem", color }}>{j.year}</div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--pitch)", marginTop: 4 }}>{j.title}</h3>
                      <p style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 4 }}>{j.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="container" style={{ padding: "72px 24px", maxWidth: 760 }}>
        <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
          Our Vision
        </p>
        <h2 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8, marginBottom: 20 }}>
          PREPARING PLAYERS FOR WHAT'S NEXT
        </h2>
        <p style={{ lineHeight: 1.7, fontSize: "1.05rem" }}>
          We train every player with one eye on what's next — preparing them technically, tactically,
          physically, and mentally for the chance to train and compete with academies abroad. Every
          session, every assessment, is part of that preparation.
        </p>
      </section>

      {/* COACHING STAFF TEASER */}
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

      {/* CTA */}
      <section style={{ background: "var(--pitch)", color: "var(--chalk)", padding: "64px 24px", textAlign: "center" }}>
        <div className="container">
          <h2 className="display" style={{ fontSize: "2rem" }}>READY TO JOIN THE ACADEMY?</h2>
          <p style={{ marginTop: 12, opacity: 0.85, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Trials run throughout the year across all age groups, and personalised coaching slots
            are available year-round. Get in touch to find out what's next.
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