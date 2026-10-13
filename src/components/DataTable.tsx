"use client";

import { useMemo, useState } from "react";
import { toCsv } from "@/lib/csv";

export type DataTableRow = { id: string; cells: string[] };

const isEmpty = (v: string) => v === "" || v === "—";
const NUM_RE = /^-?\d+(\.\d+)?%?$/;

function compareValues(a: string, b: string): number {
  if (NUM_RE.test(a) && NUM_RE.test(b)) return parseFloat(a) - parseFloat(b);
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function DataTable({
  columns,
  rows,
  filename,
  stickyCol = 0,
  maxHeight = 560,
}: {
  columns: string[];
  rows: DataTableRow[];
  filename: string;
  stickyCol?: number;
  maxHeight?: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q ? rows.filter((r) => r.cells.some((c) => c.toLowerCase().includes(q))) : rows;
    if (sort) {
      out = [...out].sort((ra, rb) => {
        const a = ra.cells[sort.col] ?? "";
        const b = rb.cells[sort.col] ?? "";
        const ea = isEmpty(a);
        const eb = isEmpty(b);
        if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1; // blanks always last
        const c = compareValues(a, b);
        return sort.dir === "asc" ? c : -c;
      });
    }
    return out;
  }, [rows, query, sort]);

  function toggleSort(col: number) {
    setSort((s) => {
      if (!s || s.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }

  function exportCsv() {
    const csv = "\uFEFF" + toCsv(columns, visible.map((r) => r.cells)); // BOM so Excel reads UTF-8 names correctly
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="no-print" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this table…"
          style={{ flex: "1 1 240px", maxWidth: 360, padding: 10, border: "1px solid #e3ded2", borderRadius: 6 }}
        />
        <span style={{ fontSize: "0.8rem", opacity: 0.65 }}>
          {visible.length === rows.length ? `${rows.length} rows` : `${visible.length} of ${rows.length} rows`}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" className="button outline" style={{ fontSize: "0.85rem" }} onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="button outline" style={{ fontSize: "0.85rem" }} onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div
        className="data-table-scroll"
        style={{ maxHeight, overflow: "auto", background: "white", border: "1px solid #e3ded2", borderRadius: 8 }}
      >
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c + i}
                  onClick={() => toggleSort(i)}
                  title="Click to sort"
                  style={{
                    position: "sticky",
                    top: 0,
                    left: i === stickyCol ? 0 : undefined,
                    zIndex: i === stickyCol ? 3 : 2,
                    background: "white",
                    boxShadow: "inset 0 -2px 0 var(--ink)",
                    padding: "12px 14px",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  {c}
                  <span style={{ opacity: 0.5, marginLeft: 4 }}>
                    {sort?.col === i ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="data-row">
                {r.cells.map((cell, i) => (
                  <td
                    key={i}
                    title={cell}
                    style={{
                      padding: "9px 14px",
                      borderBottom: "1px solid #f0ede5",
                      whiteSpace: "nowrap",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      position: i === stickyCol ? "sticky" : undefined,
                      left: i === stickyCol ? 0 : undefined,
                      background: i === stickyCol ? "white" : undefined,
                      zIndex: i === stickyCol ? 1 : undefined,
                      fontWeight: i === stickyCol ? 600 : 400,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "28px 14px", opacity: 0.65 }}>
                  No matching records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}