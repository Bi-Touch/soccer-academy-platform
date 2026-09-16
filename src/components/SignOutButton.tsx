"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      style={
        compact
          ? {
              background: "none",
              border: "1px solid #e3ded2",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "6px 12px",
            }
          : {
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--chalk)",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "8px 14px",
              marginTop: 12,
              width: "100%",
              textAlign: "left",
            }
      }
    >
      Sign out
    </button>
  );
}