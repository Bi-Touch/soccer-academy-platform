import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)" }}>ABOUT THE ACADEMY</h1>
        <p style={{ marginTop: 24, lineHeight: 1.6 }}>
          Replace this with your academy's real story — founding year, mission, and coaching
          philosophy. This page is a placeholder ready for your content.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
