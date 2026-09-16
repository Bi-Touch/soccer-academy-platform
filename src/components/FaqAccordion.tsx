"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What ages do you accept?",
    a: "We run squads from U9 through U18. Trials are held periodically for each age group — check the Fixtures page or contact us for the next trial date.",
  },
  {
    q: "What are the fees?",
    a: "Fees vary by age group and campus. Reach out via the form below and we'll send you the current fee structure and payment options.",
  },
  {
    q: "What should my child bring to training?",
    a: "Boots, shin guards, a water bottle, and both a light and dark training top. We recommend bringing a small kit bag for spare layers in cooler weather.",
  },
  {
    q: "Which campuses do you train at?",
    a: "We currently operate across four campuses. Your assigned campus depends on your age group and location — we'll confirm this once your enrollment is processed.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ marginTop: 16 }}>
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} style={{ borderBottom: "1px solid #e3ded2" }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                textAlign: "left",
                padding: "16px 0",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--pitch)",
              }}
            >
              {item.q}
              <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>{isOpen ? "\u2212" : "+"}</span>
            </button>
            {isOpen && (
              <p style={{ paddingBottom: 16, opacity: 0.8, lineHeight: 1.6 }}>{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}