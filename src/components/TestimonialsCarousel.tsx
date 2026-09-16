"use client";

import { useRef } from "react";

type Testimonial = { quote: string; role: string };

export function TestimonialsCarousel({
  title = "WHAT FAMILIES SAY",
  eyebrow = "Testimonials",
  testimonials,
}: {
  title?: string;
  eyebrow?: string;
  testimonials: Testimonial[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.clientWidth ?? 320;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: "smooth" });
  }

  const arrowStyle = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(245,243,238,0.25)",
    color: "var(--chalk)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1rem",
  } as const;

  return (
    <section style={{ background: "var(--pitch-dark)", color: "var(--chalk)", padding: "72px 0" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ letterSpacing: "0.1em", fontSize: "0.8rem", color: "var(--floodlight)", textTransform: "uppercase", fontWeight: 600 }}>
              {eyebrow}
            </p>
            <h2 className="display" style={{ fontSize: "2rem", marginTop: 8 }}>{title}</h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => scroll(-1)} aria-label="Previous" style={arrowStyle}>&#8249;</button>
            <button onClick={() => scroll(1)} aria-label="Next" style={arrowStyle}>&#8250;</button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 8,
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(245,243,238,0.1)",
                borderRadius: 12,
                padding: 28,
                minWidth: 300,
                maxWidth: 300,
                flexShrink: 0,
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "2.4rem", color: "var(--floodlight)", lineHeight: 1, fontFamily: "Georgia, serif" }}>
                &ldquo;
              </div>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.7, opacity: 0.9, flex: 1 }}>{t.quote}</p>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(245,243,238,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(245,243,238,0.12)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chalk)" strokeWidth="2" opacity="0.6">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}