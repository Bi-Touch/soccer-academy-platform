"use client";

export function PrintButton({ label = "Print this form" }: { label?: string }) {
  return (
    <button type="button" className="button no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
