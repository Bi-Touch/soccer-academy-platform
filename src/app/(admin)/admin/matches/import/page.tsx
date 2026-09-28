"use client";

import { useState } from "react";
import Link from "next/link";
import { importMatchStats } from "./actions";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";
import { MATCH_STAT_KEYS } from "@/lib/matchStats";
import type { ImportResult } from "@/lib/importResult";

const TEMPLATE_HEADERS = ["team", "matchDate", "opponent", "playerEmail", ...MATCH_STAT_KEYS];
const TEMPLATE_ROWS = [
  ["U15 Eagles", "2026-09-27", "Riverside FC", "player1@example.com", "60", "1", "1", "3", "2", "24", "19", "2", "4", "3", "1", "2", "1", "1", "0", "0"],
  ["U15 Eagles", "2026-09-27", "Riverside FC", "player2@example.com", "90", "0", "0", "1", "0", "40", "35", "1", "1", "5", "3", "4", "0", "2", "1", "0"],
];

export default function ImportMatchStatsPage() {
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
    const res = await importMatchStats(formData);
    setResult(res);
    setSubmitting(false);
  }

  return (
    <div>
      <Link href="/admin/matches" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Match Stats</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        IMPORT MATCH STATS
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>
        Matches are matched by team + date + opponent, and created automatically if they don't already exist.
        Any stat column left blank is treated as 0.
      </p>

      <DownloadCsvButton filename="match-stats-template.csv" content={toCsv(TEMPLATE_HEADERS, TEMPLATE_ROWS)} />

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