"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { PlayerAvatar } from "./PlayerAvatar";

export function UserMenu({
  name,
  role,
  photoUrl,
}: {
  name: string;
  role?: string;
  photoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <PlayerAvatar src={photoUrl ?? null} alt={name} size={38} rounded />
        <div style={{ lineHeight: 1.3, textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
          {role && <div style={{ fontSize: "0.78rem", opacity: 0.6 }}>{role}</div>}
        </div>
        <span style={{ fontSize: "0.65rem", opacity: 0.5, marginLeft: 2 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "white",
            border: "1px solid #e3ded2",
            minWidth: 150,
            boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
            zIndex: 20,
          }}
        >
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "var(--ink)",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}