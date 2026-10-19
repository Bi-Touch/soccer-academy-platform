"use client";

import { useEffect, useState, useTransition } from "react";
import { submitPlayerRegistration } from "@/app/register/player/actions";
import { EMPTY_REGISTRATION, type RegistrationFormData } from "@/lib/registrationTypes";
import { GuardianStep } from "./player-registration/GuardianStep";
import { PlayerStep } from "./player-registration/PlayerStep";
import { ConsentStep } from "./player-registration/ConsentStep";
import { ReviewStep } from "./player-registration/ReviewStep";

// Player comes before Consent so the consent step can rely on the date of birth.
const STEPS = ["Guardian", "Player", "Consent", "Review"] as const;

export default function PlayerRegistrationForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RegistrationFormData>(EMPTY_REGISTRATION);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Honeypot value. Real visitors never see the field, so this stays empty for them.
  const [honeypot, setHoneypot] = useState("");

  function update(patch: Partial<RegistrationFormData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  // The error banner is at the top of the form, but Submit is at the bottom.
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      // Built as a variable so the extra honeypot field doesn't need a change to RegistrationFormData.
      const payload = { ...data, website_url: honeypot };
      const res = await submitPlayerRegistration(payload);
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div>
      {/* Honeypot: hidden from real visitors, bots tend to fill it. Must stay empty. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>
          Leave this empty
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>
        PLAYER REGISTRATION
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        Parent/guardian registration for Academy players. No account is created until your registration is reviewed.
      </p>

      <div style={{ display: "flex", borderBottom: "1px solid #e3ded2", marginBottom: 24 }}>
        {STEPS.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 4px",
              borderBottom: i === step ? "2px solid var(--floodlight)" : "2px solid transparent",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: i <= step ? "var(--pitch)" : "#e3ded2",
                color: i <= step ? "white" : "#777",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: i === step ? 600 : 400,
                color: i <= step ? "var(--pitch)" : "#999",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          style={{ background: "#fdecec", border: "1px solid var(--card-red)", borderRadius: 8, padding: 16, marginBottom: 20, color: "var(--card-red)", fontSize: "0.9rem" }}
        >
          {error}
        </div>
      )}

      {step === 0 && <GuardianStep data={data} update={update} onNext={() => setStep(1)} />}
      {step === 1 && <PlayerStep data={data} update={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <ConsentStep data={data} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && (
        <ReviewStep
          data={data}
          onBack={() => setStep(2)}
          onEdit={(s) => setStep(s)}
          onSubmit={handleSubmit}
          submitting={pending}
        />
      )}
    </div>
  );
}