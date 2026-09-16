"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

type IconProps = { size?: number; color?: string };

function ShareIcon({ size = 16, color = "#9CA3AF" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" stroke={color} strokeWidth="2" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.78 14.08c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.02.09-3.24-.68-2.73-.94-4.51-3.68-4.65-3.86-.14-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.24-.27.53-.34.71-.34l.51.01c.16.01.38-.06.6.46.24.58.8 1.99.87 2.13.07.14.11.31.02.5-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.14-.28.28-.12.55.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.55.73 1.81.86.27.14.44.2.51.32.07.13.07.72-.17 1.4z" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

function XIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M13.93 10.74 21.16 2h-1.71l-6.28 7.59L8.15 2H2l7.58 11.01L2 22h1.71l6.63-8.01L15.85 22H22l-8.07-11.26zm-2.35 2.84-.77-1.1L4.68 3.3h2.63l4.93 7.05.77 1.1 6.4 9.16h-2.63l-5.2-7.03z" />
    </svg>
  );
}

function LinkIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.13 1.13" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.13-1.13" />
    </svg>
  );
}

const buttonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  flexShrink: 0,
};

type SharePlatform = {
  name: string;
  background: string;
  Icon: ComponentType<IconProps>;
  getHref: (url: string, title: string) => string;
};

const SHARE_PLATFORMS: SharePlatform[] = [
  {
    name: "WhatsApp",
    background: "#25D366",
    Icon: WhatsAppIcon,
    getHref: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    background: "#1877F2",
    Icon: FacebookIcon,
    getHref: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    background: "#000000",
    Icon: XIcon,
    getHref: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
];

export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  if (!url) return null;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.95rem",
          fontWeight: 500,
          color: "#F97316",
        }}
      >
        Share
        <ShareIcon />
      </span>

      {SHARE_PLATFORMS.map(({ name, background, Icon, getHref }) => (
        
        <a
          key={name}
          href={getHref(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          style={{ ...buttonStyle, background }}
        >
          <Icon />
        </a>
      ))}

      <button
        onClick={copyLink}
        aria-label="Copy link"
        style={{
          ...buttonStyle,
          background: "white",
          border: "1.5px solid #e3ded2",
          color: "var(--pitch)",
        }}
      >
        <LinkIcon />
      </button>

      {copied && (
        <span style={{ fontSize: "0.8rem", color: "var(--pitch)" }}>Copied!</span>
      )}
    </div>
  );
}