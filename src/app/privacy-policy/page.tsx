import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
        <h1 className="display" style={{ fontSize: "2.6rem", color: "var(--pitch)" }}>PRIVACY POLICY</h1>
        <p style={{ marginTop: 8, fontSize: "0.85rem", opacity: 0.6 }}>Last updated: [add date]</p>

        <div style={{ marginTop: 32, lineHeight: 1.7 }}>
          <p style={{ opacity: 0.75 }}>
            This is a placeholder policy. Replace the sections below with your academy's actual
            data practices — ideally reviewed by someone with legal expertise, since this site
            handles data belonging to minors.
          </p>

          <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginTop: 32, marginBottom: 8 }}>
            Information We Collect
          </h2>
          <p style={{ opacity: 0.75 }}>
            Describe what you collect — e.g. player names, dates of birth, photos, contact details
            submitted via enrollment or contact forms, and account information for the player portal.
          </p>

          <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginTop: 32, marginBottom: 8 }}>
            How We Use It
          </h2>
          <p style={{ opacity: 0.75 }}>
            Explain the purpose — e.g. managing enrollment, team assignment, communicating schedules,
            and publishing team news, results, and media.
          </p>

          <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginTop: 32, marginBottom: 8 }}>
            Photos and Media of Minors
          </h2>
          <p style={{ opacity: 0.75 }}>
            Explain your consent process for publishing players' names and photos publicly (team
            pages, news, gallery), and how a parent/guardian can request removal.
          </p>

          <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginTop: 32, marginBottom: 8 }}>
            Data Sharing
          </h2>
          <p style={{ opacity: 0.75 }}>
            State whether data is shared with any third parties (e.g. hosting providers, email
            services) and under what conditions.
          </p>

          <h2 style={{ fontSize: "1.2rem", color: "var(--pitch)", marginTop: 32, marginBottom: 8 }}>
            Contact
          </h2>
          <p style={{ opacity: 0.75 }}>
            Provide an email or contact method for privacy questions or data removal requests.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}