"use client";

import { useState } from "react";

export type SearchableRow = {
  id: string;
  label: string;
  node: React.ReactNode; // the <td>...</td> cells for one row
};

export function SearchableTable({
  columns,
  rows,
  placeholder = "Search...",
  maxHeight = 480,
  minWidth = 700,
  emptyMessage = "No results.",
}: {
  columns: React.ReactNode[];
  rows: SearchableRow[];
  placeholder?: string;
  maxHeight?: number;
  minWidth?: number;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? rows.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : rows;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{ display: "block", width: "100%", maxWidth: 320, padding: 10, marginBottom: 16, border: "1px solid #e3ded2", borderRadius: 6 }}
      />
      <div style={{ maxHeight, overflow: "auto", border: "1px solid #e3ded2", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
              {columns.map((c, i) => (
                <th key={i} style={{ padding: "12px 16px", position: "sticky", top: 0, background: "var(--chalk)", zIndex: 1 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: "24px 16px", opacity: 0.7 }}>{emptyMessage}</td></tr>
            ) : (
              filtered.map((r) => <tr key={r.id}>{r.node}</tr>)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}