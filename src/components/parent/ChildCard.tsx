"use client";

import { useState } from "react";
import { ChildHeader } from "./ChildHeader";
import { ChildMenu } from "./ChildMenu";

export function ChildCard({
  id,
  name,
  photoUrl,
  teamName,
  position,
  defaultOpen = false,
}: {
  id: string;
  name: string;
  photoUrl: string | null;
  teamName: string | null;
  position: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const subtitle = [teamName ?? "No team yet", position].filter(Boolean).join(" · ");

  return (
    <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 12, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`child-menu-${id}`}
        style={{ width: "100%", background: "none", border: "none", padding: 18, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "inherit" }}
      >
        <ChildHeader
          name={name}
          photoUrl={photoUrl}
          subtitle={subtitle}
          right={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none" }}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          }
        />
      </button>

      {open && (
        <div id={`child-menu-${id}`} style={{ padding: "0 18px 18px" }}>
          <ChildMenu playerId={id} />
        </div>
      )}
    </div>
  );
}