import Link from "next/link";
import { requireStaff } from "@/lib/permissions";
import {
  TEST_PROTOCOLS,
  TRAINING_LOG_FIELDS,
  SCHEDULE_FIELDS,
  MATCH_STAT_DEFINITIONS,
  ASSESSMENT_RATING_SCALE,
  ASSESSMENT_DOMAIN_GUIDE,
} from "@/lib/dataCollectionGuide";

export default async function DataCollectionGuidePage() {
  await requireStaff();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>DATA COLLECTION GUIDE</h1>
          <p style={{ opacity: 0.7, marginTop: 4 }}>What each module captures and how to record it consistently.</p>
        </div>
        <Link href="/downloads/data-collection-protocols.docx" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", whiteSpace: "nowrap" }}>
          ⬇ Download Word document
        </Link>
      </div>

      <div style={{ marginTop: 28 }}>
        <details className="guide-section" open>
          <summary className="guide-section-summary">1. Physical Tests</summary>
          <div className="guide-section-body">
            <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: 16 }}>
              A player needs a date of birth and sex set for results to be scored automatically against age/sex benchmark bands.
            </p>
            {TEST_PROTOCOLS.map((t) => (
              <details className="protocol-card" key={t.code}>
                <summary className="protocol-summary">
                  <span>
                    {t.label}{" "}
                    <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85rem" }}>
                      ({t.unit}, {t.lowerIsBetter ? "lower is better" : "higher is better"})
                    </span>
                  </span>
                </summary>
                <div className="protocol-body">
                  <p style={{ marginBottom: 10 }}><strong>Captures:</strong> {t.captures}</p>
                  <ol style={{ paddingLeft: 20, margin: 0 }}>
                    {t.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </details>

        <details className="guide-section">
          <summary className="guide-section-summary">2. Training Log</summary>
          <div className="guide-section-body">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
                  <th style={{ padding: "12px 0" }}>Field</th>
                  <th style={{ padding: "12px 8px" }}>Captures</th>
                  <th style={{ padding: "12px 8px" }}>How to record</th>
                </tr>
              </thead>
              <tbody>
                {TRAINING_LOG_FIELDS.map((f) => (
                  <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600 }}>{f.field}</td>
                    <td style={{ padding: "10px 8px" }}>{f.captures}</td>
                    <td style={{ padding: "10px 8px" }}>{f.howTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className="guide-section">
          <summary className="guide-section-summary">3. Schedule</summary>
          <div className="guide-section-body">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {SCHEDULE_FIELDS.map((f) => (
                  <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600, width: 160 }}>{f.field}</td>
                    <td style={{ padding: "10px 8px" }}>{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className="guide-section">
          <summary className="guide-section-summary">4. Match Stats</summary>
          <div className="guide-section-body">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {MATCH_STAT_DEFINITIONS.map((f) => (
                  <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600, width: 160 }}>{f.field}</td>
                    <td style={{ padding: "10px 8px" }}>{f.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className="guide-section">
          <summary className="guide-section-summary">5. Development Assessments</summary>
          <div className="guide-section-body">
            <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8 }}>Rating scale (1–5)</p>
            {ASSESSMENT_RATING_SCALE.map((r) => (
              <p key={r.score} style={{ fontSize: "0.85rem", margin: "2px 0" }}><strong>{r.score}</strong> — {r.meaning}</p>
            ))}
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "8px 0 20px" }}>
              Leave an attribute unrated if you haven't observed enough to judge it fairly.
            </p>

            {Object.entries(ASSESSMENT_DOMAIN_GUIDE).map(([domain, attrs]) => (
              <details className="protocol-card" key={domain}>
                <summary className="protocol-summary">
                  <span>
                    {domain} <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85rem" }}>({attrs.length} attributes)</span>
                  </span>
                </summary>
                <div className="protocol-body">
                  {attrs.map((a) => (
                    <p key={a.attribute} style={{ margin: "4px 0" }}>
                      <strong>{a.attribute}</strong> — {a.lookFor}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}