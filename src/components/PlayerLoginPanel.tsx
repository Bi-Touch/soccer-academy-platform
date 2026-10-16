"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerLoginResult } from "@/lib/playerLoginTypes";

type Action = (formData: FormData) => Promise<PlayerLoginResult>;

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20 };

export function PlayerLoginPanel({
  playerName,
  hasLogin,
  loginEmail,
  youngPlayer,
  createAction,
  resetAction,
}: {
  playerName: string;
  hasLogin: boolean;
  loginEmail: string | null;
  youngPlayer: boolean;
  createAction: Action;
  resetAction: Action;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string; emailAttempted: boolean } | null>(null);

  async function run(action: Action, form: HTMLFormElement) {
    setBusy(true);
    setError(null);
    try {
      const res = await action(new FormData(form));
      if (res.ok) {
        setCredentials({ email: res.email, tempPassword: res.tempPassword, emailAttempted: res.emailAttempted });
        router.refresh();
      } else {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPassword() {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // The password is held in this component's state, never stored, so it disappears on refresh.
  if (credentials) {
    return (
      <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 20 }}>
        <p style={{ fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
          Login ready. Give these details to {playerName}.
        </p>
        <p style={{ fontSize: "0.9rem", marginBottom: 6 }}><strong>Email:</strong> {credentials.email}</p>
        <p style={{ fontSize: "0.9rem", marginBottom: 12 }}>
          <strong>Temporary password:</strong>{" "}
          <code style={{ background: "white", padding: "2px 8px", borderRadius: 4, userSelect: "all" }}>{credentials.tempPassword}</code>{" "}
          <button type="button" onClick={copyPassword} style={{ background: "none", border: "none", color: "var(--pitch)", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}>
            {copied ? "Copied" : "Copy"}
          </button>
        </p>
        <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.5 }}>
          This is shown once and can't be retrieved later. You can reset it any time.
          {credentials.emailAttempted && " We also tried to email these details; if they don't arrive, share them directly."}
        </p>
        <button type="button" className="button" style={{ marginTop: 16 }} onClick={() => setCredentials(null)}>
          Done
        </button>
      </div>
    );
  }

  if (hasLogin) {
    return (
      <div style={cardStyle}>
        <p style={{ fontSize: "0.85rem", opacity: 0.65 }}>Current login</p>
        <p style={{ fontWeight: 600, marginTop: 2 }}>{loginEmail}</p>
        <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: "12px 0 16px", lineHeight: 1.5 }}>
          {playerName} can sign in at the Academy sign-in page. If they've forgotten their password, set a new temporary one below.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!window.confirm(`Set a new temporary password for ${playerName}? Their current password will stop working.`)) return;
            void run(resetAction, e.currentTarget);
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", marginBottom: 16 }}>
            <input type="checkbox" name="sendEmail" defaultChecked />
            Email the new password to {loginEmail}
          </label>
          {error && <p style={{ color: "var(--card-red)", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="button outline" disabled={busy}>
            {busy ? "Working…" : "Reset password"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <p style={{ fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 16 }}>
        {playerName} doesn't have a portal login yet. Enter their own email address, and a temporary password will be generated.
      </p>

      {youngPlayer && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.85rem", lineHeight: 1.5 }}>
          {playerName} is under 13. For younger players the parent or guardian normally manages access through their own login.
          Only create a separate login if the guardian is happy for them to have one.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(createAction, e.currentTarget);
        }}
      >
        <label style={{ fontSize: "0.85rem" }}>
          Player's email (used to sign in)
          <input name="email" type="email" required autoComplete="off" style={inputStyle} />
        </label>
        <p style={{ fontSize: "0.75rem", opacity: 0.6, margin: "6px 0 16px" }}>
          This can't be the parent's email: each email can only belong to one account.
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", marginBottom: 16 }}>
          <input type="checkbox" name="sendEmail" defaultChecked />
          Email the login details to this address
        </label>

        {error && <p style={{ color: "var(--card-red)", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="button" disabled={busy}>
          {busy ? "Creating…" : "Create login"}
        </button>
      </form>
    </div>
  );
}