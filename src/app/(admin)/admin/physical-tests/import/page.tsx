"use client";

import { useState } from "react";
import Link from "next/link";
import { importPhysicalTests } from "./actions";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";
import { PHYSICAL_TEST_METRICS } from "@/lib/physicalTests";
import type { ImportResult } from "@/lib/importResult";

const METRIC_HEADERS = PHYSICAL_TEST_METRICS.map((m) => m.label);
const TEMPLATE_HEADERS = ["team", "testDate", "playerEmail", "player", "testedBy", ...METRIC_HEADERS];
const TEMPLATE_ROWS = [
  ["U15 Eagles", "2026-09-20", "player1@example.com", "", "Coach John", "2.2", "5.3", "2.95", "800", "24", "4.4"],
  ["U15 Eagles", "2026-09-20", "", "Test Player", "Coach John", "2.3", "5.6", "", "", "", ""],
];

export default function ImportPhysicalTestsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importPhysicalTests(formData);
      setResult(res);
    } catch {
      setResult({
        createdCount: 0,
        updatedCount: 0,
        errors: [{ row: 0, message: "An unexpected error occurred while importing the file." }],
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/admin/physical-tests" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Physical Tests</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        IMPORT PHYSICAL TESTS
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 8 }}>
        One row per player per test day. Players are matched by team and email when available, or by full name for
        players without a login (e.g. those registered by a parent/guardian). An existing test for the same player
        and date is updated, not duplicated.
      </p>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        Leave a metric column blank if that player wasn't tested on it &mdash; it's skipped, not saved as zero.
        Scores are calculated automatically for players with a date of birth and sex set.
      </p>

      <DownloadCsvButton filename="physical-tests-template.csv" content={toCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)} />

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