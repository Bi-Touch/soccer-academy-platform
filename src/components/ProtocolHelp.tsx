"use client";

import { useState } from "react";
import type { TestProtocol } from "@/lib/dataCollectionGuide";

export function ProtocolHelp({ protocol }: { protocol: TestProtocol }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", color: "var(--pitch)", fontSize: "0.78rem", padding: 0, cursor: "pointer", textDecoration: "underline" }}
      >
        {open ? "Hide" : "How to measure this"}
      </button>
      {open && (
        <div style={{ background: "#f4f1ea", borderRadius: 6, padding: 12, marginTop: 6, fontSize: "0.8rem" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{protocol.captures}</p>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {protocol.steps.map((s, i) => <li key={i} style={{ marginBottom: 3 }}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}