"use client";

import { useState } from "react";

export function ExportCsvButton({
  action,
  filename,
  label = "Export CSV",
}: {
  action: () => Promise<string>;
  filename: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await action();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleExport} className="button outline" disabled={loading} style={{ fontSize: "0.85rem" }}>
      {loading ? "Exporting..." : label}
    </button>
  );
}