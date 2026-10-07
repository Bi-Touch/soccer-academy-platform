"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "./actions";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const res = await resetPassword(token, password);

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || "This reset link is invalid or has expired.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pitch)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--chalk)",
          padding: "40px 36px",
          width: 380,
          maxWidth: "100%",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        <h1
          className="display"
          style={{
            fontSize: "1.8rem",
            color: "var(--pitch)",
            marginBottom: 20,
          }}
        >
          RESET PASSWORD
        </h1>

        {!token ? (
          <p style={{ fontSize: "0.9rem" }}>
            This reset link is missing a token. Request a new one from the
            sign-in page.
          </p>
        ) : done ? (
          <p style={{ fontSize: "0.9rem" }}>
            Password updated. Redirecting you to sign in...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                marginBottom: 16,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--pitch)",
              }}
            >
              New password

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px 14px",
                  marginTop: 6,
                  border: "1px solid #d8d2c2",
                  borderRadius: 8,
                }}
              />
            </label>

            <label
              style={{
                display: "block",
                marginBottom: 16,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--pitch)",
              }}
            >
              Confirm new password

              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px 14px",
                  marginTop: 6,
                  border: "1px solid #d8d2c2",
                  borderRadius: 8,
                }}
              />
            </label>

            {error && (
              <p
                style={{
                  color: "var(--card-red)",
                  fontSize: "0.85rem",
                  marginBottom: 14,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="button"
              disabled={submitting}
              style={{ width: "100%" }}
            >
              {submitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pitch)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--chalk)",
          padding: "40px 36px",
          width: 380,
          maxWidth: "100%",
          borderRadius: 14,
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}