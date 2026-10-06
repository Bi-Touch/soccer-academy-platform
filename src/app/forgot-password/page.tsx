"use client";

import { useState } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pitch)", padding: 20 }}>
      <div style={{ background: "var(--chalk)", padding: "40px 36px", width: 380, maxWidth: "100%", borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <h1 className="display" style={{ fontSize: "1.8rem", color: "var(--pitch)", marginBottom: 8 }}>
          FORGOT PASSWORD
        </h1>

        {submitted ? (
          <p style={{ fontSize: "0.9rem", lineHeight: 1.6, marginTop: 16 }}>
            If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox.
          </p>
        ) : (
          <>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: 20 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", marginBottom: 16, fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ display: "block", width: "100%", padding: "11px 14px", marginTop: 6, border: "1px solid #d8d2c2", borderRadius: 8 }}
                />
              </label>
              <button type="submit" className="button" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <a href="/login" style={{ display: "block", textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--pitch)", opacity: 0.75 }}>
          &larr; Back to sign in
        </a>
      </div>
    </div>
  );
}