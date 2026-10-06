"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as any)?.role;
    if (role === "ADMIN" || role === "COACH") {
      router.push("/admin/players");
    } else if (role === "PARENT") {
      router.push("/portal/parent");
    } else {
      router.push("/portal/dashboard");
    }
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "11px 14px",
    marginTop: 6,
    border: "1px solid #d8d2c2",
    borderRadius: 8,
    fontSize: "0.95rem",
    background: "white",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pitch)",
        backgroundImage: "radial-gradient(circle at 30% 20%, rgba(232,163,61,0.08), transparent 55%)",
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--pitch)",
              color: "var(--floodlight)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Big Shoulders Display', sans-serif",
              fontWeight: 800,
              fontSize: "1.3rem",
              marginBottom: 14,
            }}
          >
            ⚽
          </div>
          <h1 className="display" style={{ fontSize: "1.8rem", color: "var(--pitch)" }}>
            SIGN IN
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: 4 }}>
            KickOasis
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16, fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--floodlight)")}
              onBlur={(e) => (e.target.style.borderColor = "#d8d2c2")}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8, fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>
            Password
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => (e.target.style.borderColor = "var(--floodlight)")}
                onBlur={(e) => (e.target.style.borderColor = "#d8d2c2")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  color: "var(--pitch)",
                  opacity: 0.6,
                  padding: 4,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Remember me
            </label>
            <a href="/forgot-password" style={{ fontSize: "0.8rem", color: "var(--pitch)", opacity: 0.75 }}>
              Forgot password?
            </a>
          </div>

          {error && (
            <p style={{ color: "var(--card-red)", fontSize: "0.85rem", marginBottom: 14 }}>{error}</p>
          )}

          <button type="submit" className="button" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}