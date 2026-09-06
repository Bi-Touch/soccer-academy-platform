import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 560 }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)" }}>CONTACT & ENROLLMENT</h1>
        <p style={{ marginTop: 24, lineHeight: 1.6 }}>
          Wire this form to an email service or a ContactSubmission table once you're ready.
          For now this is a static placeholder.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
