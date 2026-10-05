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

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 };

export default async function DataCollectionGuidePage() {
  await requireStaff();

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>DATA COLLECTION GUIDE</h1>
      <p style={{ opacity: 0.7, marginTop: 4 }}>
        What each module captures and how to record it consistently.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0 32px" }}>
        <a href="#physical-tests" style={{ fontSize: "0.85rem" }}>Physical Tests</a>
        <a href="#training-log" style={{ fontSize: "0.85rem" }}>Training Log</a>
        <a href="#schedule" style={{ fontSize: "0.85rem" }}>Schedule</a>
        <a href="#match-stats" style={{ fontSize: "0.85rem" }}>Match Stats</a>
        <a href="#assessments" style={{ fontSize: "0.85rem" }}>Assessments</a>
        <Link href="/downloads/data-collection-protocols.docx" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)" }}>
          ⬇ Download Word document
        </Link>
      </div>

      <h2 id="physical-tests" className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", marginBottom: 12 }}>
        1. Physical Tests
      </h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: 16 }}>
        A player needs a date of birth and sex set for results to be scored automatically against age/sex benchmark bands.
      </p>
      {TEST_PROTOCOLS.map((t) => (
        <div key={t.code} style={cardStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 4 }}>
            {t.label} <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.85rem" }}>({t.unit}, {t.lowerIsBetter ? "lower is better" : "higher is better"})</span>
          </h3>
          <p style={{ fontSize: "0.9rem", marginBottom: 10 }}><strong>Captures:</strong> {t.captures}</p>
          <ol style={{ fontSize: "0.9rem", paddingLeft: 20, margin: 0 }}>
            {t.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ol>
        </div>
      ))}

      <h2 id="training-log" className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", margin: "32px 0 12px" }}>
        2. Training Log
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>Field</th>
              <th style={{ padding: "12px 16px" }}>Captures</th>
              <th style={{ padding: "12px 16px" }}>How to record</th>
            </tr>
          </thead>
          <tbody>
            {TRAINING_LOG_FIELDS.map((f) => (
              <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                <td style={{ padding: "10px 16px", fontWeight: 600 }}>{f.field}</td>
                <td style={{ padding: "10px 16px" }}>{f.captures}</td>
                <td style={{ padding: "10px 16px" }}>{f.howTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="schedule" className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", margin: "32px 0 12px" }}>
        3. Schedule
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {SCHEDULE_FIELDS.map((f) => (
              <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                <td style={{ padding: "10px 16px", fontWeight: 600, width: 160 }}>{f.field}</td>
                <td style={{ padding: "10px 16px" }}>{f.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="match-stats" className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", margin: "32px 0 12px" }}>
        4. Match Stats
      </h2>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {MATCH_STAT_DEFINITIONS.map((f) => (
              <tr key={f.field} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem" }}>
                <td style={{ padding: "10px 16px", fontWeight: 600, width: 160 }}>{f.field}</td>
                <td style={{ padding: "10px 16px" }}>{f.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="assessments" className="display" style={{ fontSize: "1.6rem", color: "var(--pitch)", margin: "32px 0 12px" }}>
        5. Development Assessments
      </h2>
      <div style={cardStyle}>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8 }}>Rating scale (1–5)</p>
        {ASSESSMENT_RATING_SCALE.map((r) => (
          <p key={r.score} style={{ fontSize: "0.85rem", margin: "2px 0" }}><strong>{r.score}</strong> — {r.meaning}</p>
        ))}
        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 8 }}>
          Leave an attribute unrated if you haven't observed enough to judge it fairly.
        </p>
      </div>
      {Object.entries(ASSESSMENT_DOMAIN_GUIDE).map(([domain, attrs]) => (
        <div key={domain} style={cardStyle}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 10 }}>{domain}</h3>
          {attrs.map((a) => (
            <p key={a.attribute} style={{ fontSize: "0.85rem", margin: "4px 0" }}>
              <strong>{a.attribute}</strong> — {a.lookFor}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}