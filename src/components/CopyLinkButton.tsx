"use client";

import { useEffect, useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  // Build the full URL from the browser's own origin, so it is always right
  // for whichever environment you are on (no dependence on NEXTAUTH_URL).
  useEffect(() => {
    setUrl(window.location.origin + path);
  }, [path]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <code style={{ fontSize: "0.85rem", background: "#f4f1ea", padding: "6px 10px", borderRadius: 6, wordBreak: "break-all" }}>
        {url}
      </code>
      <button type="button" className="button outline" onClick={copy} style={{ fontSize: "0.85rem" }}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}