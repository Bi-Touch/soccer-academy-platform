"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/portal/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pitch)" }}>
      <form onSubmit={handleSubmit} style={{ background: "var(--chalk)", padding: 40, width: 360 }}>
        <h1 className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginBottom: 24 }}>
          SIGN IN
        </h1>
        <label style={{ display: "block", marginBottom: 12, fontSize: "0.9rem" }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 20, fontSize: "0.9rem" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>
        {error && <p style={{ color: "var(--card-red)", fontSize: "0.9rem", marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="button" style={{ width: "100%" }}>
          Sign in
        </button>
      </form>
    </div>
  );
}
