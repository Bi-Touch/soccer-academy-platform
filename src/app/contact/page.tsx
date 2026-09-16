"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FaqAccordion } from "@/components/FaqAccordion";
import { submitContactForm } from "./actions";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);
    if (result.ok) {
      setStatus("success");
      e.currentTarget.reset();
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <SiteHeader />
      <section className="container" style={{ padding: "64px 24px", maxWidth: 560 }}>
        <h1 className="display" style={{ fontSize: "3rem", color: "var(--pitch)" }}>CONTACT & ENROLLMENT</h1>
        <p style={{ marginTop: 16, lineHeight: 1.6, opacity: 0.8 }}>
          Interested in enrolling, or have a question? Send us a message and we'll get back to you.
        </p>

        {status === "success" ? (
          <div style={{ marginTop: 32, padding: 24, background: "white", borderLeft: "4px solid var(--floodlight)" }}>
            Thanks — your message has been sent. We'll be in touch soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
            <label>
              Name
              <input name="name" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
            </label>
            <label>
              Email
              <input name="email" type="email" required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
            </label>
            <label>
              Phone (optional)
              <input name="phone" style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
            </label>
            <label>
              Message
              <textarea name="message" rows={5} required style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }} />
            </label>

            {status === "error" && <p style={{ color: "var(--card-red)", fontSize: "0.9rem" }}>{error}</p>}

            <button type="submit" className="button" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending..." : "Send message"}
            </button>
          </form>
                )}

        <h2 className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", marginTop: 56, marginBottom: 8 }}>
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <FaqAccordion />
      </section>
      <SiteFooter />
    </>
  );
}