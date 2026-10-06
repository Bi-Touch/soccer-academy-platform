"use client";

import { useState } from "react";
import type { TestProtocol } from "@/lib/dataCollectionGuide";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, marginBottom: 16, overflow: "hidden" };

export function ProtocolAccordion({ protocol, defaultOpen = false }: { protocol: TestProtocol; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span>
          <span style={{ fontWeight: 600, color: "var(--pitch)" }}>{protocol.label}</span>{" "}
          <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>({protocol.unit}, {protocol.lowerIsBetter ? "lower is better" : "higher is better"})</span>
        </span>
        <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>{open ? "− Hide" : "+ Show protocol"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontSize: "0.9rem", marginBottom: 10 }}><strong>Captures:</strong> {protocol.captures}</p>
          <ol style={{ fontSize: "0.9rem", paddingLeft: 20, margin: 0 }}>
            {protocol.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}