"use client";

import { useState } from "react";

export type SearchableItem = {
  id: string;
  label: string; // text matched against the search query, not displayed
  node: React.ReactNode;
};

export function SearchableList({
  items,
  placeholder = "Search...",
  maxHeight = 480,
  emptyMessage = "No results.",
}: {
  items: SearchableItem[];
  placeholder?: string;
  maxHeight?: number;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{ display: "block", width: "100%", maxWidth: 320, padding: 10, marginBottom: 16, border: "1px solid #e3ded2", borderRadius: 6 }}
      />
      <div style={{ maxHeight, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {filtered.length === 0 ? (
          <p style={{ opacity: 0.7 }}>{emptyMessage}</p>
        ) : (
          filtered.map((i) => <div key={i.id}>{i.node}</div>)
        )}
      </div>
    </div>
  );
}