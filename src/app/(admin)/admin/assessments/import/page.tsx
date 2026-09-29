"use client";

import { useState } from "react";
import Link from "next/link";
import { importAssessments } from "./actions";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";
import type { ImportResult } from "@/lib/importResult";
import { ASSESSMENT_ATTRIBUTES } from "@/lib/assessmentAttributes";

const ATTRIBUTE_HEADERS = Object.values(ASSESSMENT_ATTRIBUTES).flat();
const TEMPLATE_HEADERS = ["player", "team", "date", "assessedBy", "summary", "nextGoals", ...ATTRIBUTE_HEADERS];
const TEMPLATE_ROWS = [
  [
    "Achraf Hakimi", "U15 Eagles", "2026-09-20", "", "Good progress this month", "Work on weak-foot passing",
    ...ATTRIBUTE_HEADERS.map((_, i) => (i < 3 ? "4" : "")),
  ],
];

export default function ImportAssessmentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await importAssessments(formData);
    setResult(res);
    setSubmitting(false);
  }

  return (
    <div>
      <Link href="/admin/assessments" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Assessments</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        IMPORT ASSESSMENTS
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        Upload a CSV of development assessments to create them in bulk. Match a player by exact "player" name and
        "team" name. Attribute columns are scored 1–5 — leave a cell blank to skip that attribute.
      </p>

      <DownloadCsvButton filename="assessments-template.csv" content={toCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)} />

      <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 480 }}>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "block", marginBottom: 16 }} />
        <button type="submit" className="button" disabled={!file || submitting}>
          {submitting ? "Importing..." : "Import"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24, maxWidth: 640 }}>
          <p style={{ fontWeight: 600 }}>
            {result.createdCount} created{result.errors.length > 0 ? `, ${result.errors.length} row(s) failed` : ""}
          </p>
          {result.errors.length > 0 && (
            <ul style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--card-red)" }}>
              {result.errors.map((err, i) => (
                <li key={i}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}