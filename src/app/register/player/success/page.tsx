import Link from "next/link";

export default function RegistrationSuccessPage() {
  return (
    <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <h1 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginBottom: 16 }}>
        REGISTRATION SUBMITTED
      </h1>
      <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
        Thank you. The player's registration has been submitted and is currently <strong>Pending Review</strong>.
      </p>
      <p style={{ lineHeight: 1.6, opacity: 0.8, marginBottom: 24 }}>
        The Academy will review the registration and contact you if any additional information is required.
        No player account has been activated yet — you'll receive login details by email once your registration
        is approved.
      </p>
      <Link href="/" className="button">Back to home</Link>
    </div>
  );
}