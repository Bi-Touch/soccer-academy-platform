import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "120px 24px", textAlign: "center" }}>
        <div className="display" style={{ fontSize: "6rem", color: "var(--pitch)" }}>404</div>
        <h1 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 8 }}>
          OFFSIDE — THIS PAGE DOESN'T EXIST
        </h1>
        <p style={{ marginTop: 16, opacity: 0.75, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          The page you're looking for has moved, or never existed. Let's get you back on side.
        </p>
        <Link href="/" className="button" style={{ display: "inline-block", marginTop: 32 }}>
          Back to homepage
        </Link>
      </section>
      <SiteFooter />
    </>
  );
}