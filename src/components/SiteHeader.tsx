"use client";

import Link from "next/link";
import { useState } from "react";

const SQUAD_LINKS = [
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/coaches", label: "Coaches" },
  { href: "/fixtures", label: "Fixtures" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSquadOpen, setMobileSquadOpen] = useState(false);

  return (
    <header style={{ background: "var(--pitch)", color: "var(--chalk)", position: "sticky", top: 0, zIndex: 30 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px" }}>
        <Link href="/" className="display" style={{ fontSize: "1.6rem", color: "var(--chalk)", textDecoration: "none" }}>
          ACADEMY
        </Link>

        <nav className="nav-desktop" style={{ display: "flex", gap: 28, fontSize: "0.95rem", alignItems: "center" }}>
          <Link href="/about" style={{ textDecoration: "none" }}>About</Link>

          <div className="squad-menu" style={{ position: "relative" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "default" }}>
              Squad
            </span>

            <div
              className="squad-dropdown"
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                paddingTop: 14,
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e3ded2",
                  borderRadius: 10,
                  minWidth: 160,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                {SQUAD_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    style={{
                      display: "block",
                      padding: "10px 16px",
                      textDecoration: "none",
                      color: "var(--ink)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/gallery" style={{ textDecoration: "none" }}>Gallery</Link>
          <Link href="/news" style={{ textDecoration: "none" }}>News</Link>
          <Link href="/contact" style={{ textDecoration: "none" }}>Contact</Link>

          <Link href="/login" className="button" style={{ borderRadius: 8 }}>Player Login</Link>
        </nav>

        <button
          className="nav-toggle"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--chalk)",
            fontSize: "1.6rem",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          {mobileOpen ? "\u2715" : "\u2630"}
        </button>
      </div>

      {mobileOpen && (
        <nav
          className="nav-mobile-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "8px 24px 20px",
            borderTop: "1px solid rgba(245,243,238,0.15)",
          }}
        >
          <Link href="/about" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none", padding: "10px 0", fontSize: "1rem" }}>
            About
          </Link>

          <button
            onClick={() => setMobileSquadOpen((o) => !o)}
            aria-expanded={mobileSquadOpen}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              color: "var(--chalk)",
              padding: "10px 0",
              fontSize: "1rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Squad
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{mobileSquadOpen ? "\u25B2" : "\u25BC"}</span>
          </button>
          {mobileSquadOpen && (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: 16 }}>
              {SQUAD_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: "none", padding: "8px 0", fontSize: "0.9rem", opacity: 0.85 }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          <Link href="/gallery" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none", padding: "10px 0", fontSize: "1rem" }}>
            Gallery
          </Link>
          <Link href="/news" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none", padding: "10px 0", fontSize: "1rem" }}>
            News
          </Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none", padding: "10px 0", fontSize: "1rem" }}>
            Contact
          </Link>

          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="button"
            style={{ borderRadius: 8, marginTop: 8, textAlign: "center" }}
          >
            Player Login
          </Link>
        </nav>
      )}

      <style>{`
        .squad-dropdown a:hover {
          background: var(--chalk);
        }
        .squad-dropdown {
          opacity: 0;
          visibility: hidden;
          transform: translateX(-50%) translateY(-6px);
          transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
        }
        .squad-menu:hover .squad-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
}