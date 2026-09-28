"use client";

import { useState } from "react";
import Link from "next/link";
import { importTrainingLog } from "./actions";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";
import type { ImportResult } from "@/lib/importResult";

const TEMPLATE_HEADERS = ["team", "sessionDate", "sessionTime", "sessionTitle", "playerEmail", "status", "rating", "note"];
const TEMPLATE_ROWS = [
  ["U15 Eagles", "2026-09-20", "16:00", "Passing and High Press", "player1@example.com", "PRESENT", "4", "Good movement off the ball"],
  ["U15 Eagles", "2026-09-20", "16:00", "Passing and High Press", "player2@example.com", "LATE", "3", ""],
];

export default function ImportTrainingLogPage() {
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
    const res = await importTrainingLog(formData);
    setResult(res);
    setSubmitting(false);
  }

  return (
    <div>
      <Link href="/admin/training" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Training Log</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        IMPORT TRAINING LOG
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 8 }}>
        Sessions are matched by team + date + title, and created automatically if they don't already exist.
      </p>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        "status" must be PRESENT, LATE, ABSENT_EXCUSED, ABSENT_UNEXCUSED, or INJURED. "rating" is optional, 1&ndash;5.
      </p>

      <DownloadCsvButton filename="training-log-template.csv" content={toCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)} />

      <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 480 }}>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "block", marginBottom: 16 }} />
        <button type="submit" className="button" disabled={!file || submitting}>
          {submitting ? "Importing..." : "Import"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24, maxWidth: 640 }}>
          <p style={{ fontWeight: 600 }}>
            {result.createdCount} created, {result.updatedCount} updated
            {result.errors.length > 0 ? `, ${result.errors.length} row(s) failed` : ""}
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