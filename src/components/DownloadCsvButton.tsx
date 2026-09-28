"use client";

export function DownloadCsvButton({
  filename,
  content,
  label,
}: {
  filename: string;
  content: string;
  label?: string;
}) {
  function handleDownload() {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
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
    <button type="button" onClick={handleDownload} className="button secondary" style={{ fontSize: "0.85rem" }}>
      {label ?? "Download CSV template"}
    </button>
  );
}