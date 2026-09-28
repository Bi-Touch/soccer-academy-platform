"use client";

import { useState } from "react";
import Link from "next/link";
import { importSchedule } from "./actions";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";
import type { ImportResult } from "@/lib/importResult";

const TEMPLATE_HEADERS = ["team", "type", "date", "time", "title", "location", "opponent", "homeScore", "awayScore", "description"];
const TEMPLATE_ROWS = [
  ["U15 Eagles", "TRAINING", "2026-09-20", "16:00", "Passing and High Press", "Training Field", "", "", "", "Focus on quick combinations"],
  ["U15 Eagles", "MATCH", "2026-09-27", "15:00", "vs Riverside FC", "Home Ground", "Riverside FC", "3", "1", "Season opener"],
];

export default function ImportSchedulePage() {
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
    const res = await importSchedule(formData);
    setResult(res);
    setSubmitting(false);
  }

  return (
    <div>
      <Link href="/admin/schedule" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Schedule</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        IMPORT SCHEDULE
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        Upload a CSV of training sessions, matches, or drills to create them in bulk. "type" must be TRAINING, MATCH, DRILL, or OTHER.
      </p>

      <DownloadCsvButton filename="schedule-template.csv" content={toCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)} />

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