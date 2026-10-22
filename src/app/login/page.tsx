"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function dashboardFor(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
    case "COACH":
      return "/admin";

    case "SAFEGUARDING_LEAD":
      return "/admin/safeguarding";

    case "MEDICAL_OFFICER":
      return "/admin/health";

    case "ANALYST":
      return "/analytics";

    case "PARENT":
      return "/portal/parent";

    case "PLAYER":
      return "/portal/dashboard";

    default:
      // Never send an unrecognized role into a privileged area.
      return "/login?error=role";
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        rememberMe,
      });

      if (!result || result.error) {
        setError("Incorrect email or password.");
        return;
      }

      // Read the session after credentials sign-in succeeds.
      const session = await getSession();
      const role = session?.user?.role;

      if (!role) {
        setError(
          "Your account role could not be verified. Please sign in again or contact the administrator."
        );
        return;
      }

      const destination = dashboardFor(role);

      if (destination === "/login?error=role") {
        setError(
          "Your account does not have a recognized role. Please contact the administrator."
        );
        return;
      }

      // Replace the login page so Back does not return to the form.
      router.replace(destination);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
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
        backgroundImage:
          "radial-gradient(circle at 30% 20%, rgba(232,163,61,0.08), transparent 55%)",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "var(--chalk)",
          padding: "40px 36px",
          width: 380,
          maxWidth: "100%",
          boxSizing: "border-box",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Image
              src="/images/KO.png"
              alt="KickOasis Academy Logo"
              width={200}
              height={80}
              priority
              style={{
                width: "auto",
                height: 80,
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <h1
            className="display"
            style={{
              fontSize: "1.8rem",
              color: "var(--pitch)",
              margin: 0,
            }}
          >
            SIGN IN
          </h1>
        </div>

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
            Email

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--floodlight)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(232,163,61,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d8d2c2";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--pitch)",
            }}
          >
            Password

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={submitting}
                style={{
                  ...inputStyle,
                  paddingRight: 60,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--floodlight)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(232,163,61,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d8d2c2";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
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
                  opacity: 0.7,
                  padding: 4,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 20,
              marginTop: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8rem",
                cursor: "pointer",
                color: "var(--pitch)",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={submitting}
                style={{ cursor: "pointer" }}
              />
              Remember me
            </label>

            <a
              href="/forgot-password"
              style={{
                fontSize: "0.8rem",
                color: "var(--pitch)",
                opacity: 0.75,
                textDecoration: "none",
              }}
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "var(--card-red)",
                fontSize: "0.85rem",
                marginTop: 0,
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
            style={{
              width: "100%",
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            marginBottom: 0,
            fontSize: "0.85rem",
          }}
        >
          New to the Academy?{" "}
          <a
            href="/register/player"
            style={{
              color: "var(--pitch)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Register your child
          </a>
        </p>
      </div>
    </div>
  );
}