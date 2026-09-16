"use client";

import { useState } from "react";
import { getVideoKind, getEmbedUrl } from "@/lib/video";

type VideoItem = { id: string; title: string; url: string; thumbnailUrl: string | null };

export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? videos[openIndex] : null;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {videos.map((video, i) => (
          <button
            key={video.id}
            onClick={() => setOpenIndex(i)}
            style={{ textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <div
              style={{
                background: video.thumbnailUrl ? `url(${video.thumbnailUrl}) center/cover` : "var(--pitch-dark)",
                aspectRatio: "16/9",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "9px solid transparent",
                    borderBottom: "9px solid transparent",
                    borderLeft: "14px solid var(--pitch)",
                    marginLeft: 3,
                  }}
                />
              </div>
            </div>
            <div style={{ padding: "8px 0", fontWeight: 600, color: "var(--ink)" }}>{video.title}</div>
          </button>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpenIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,42,32,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 900 }}
          >
            <VideoPlayer url={open.url} title={open.title} />
            <p style={{ color: "var(--chalk)", marginTop: 12, fontSize: "0.95rem" }}>{open.title}</p>
          </div>

          <button
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "1px solid rgba(245,243,238,0.4)",
              color: "var(--chalk)",
              fontSize: "1.2rem",
              width: 40,
              height: 40,
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}

function VideoPlayer({ url, title }: { url: string; title: string }) {
  const kind = getVideoKind(url);
  const embedUrl = getEmbedUrl(url);

  if ((kind === "youtube" || kind === "vimeo") && embedUrl) {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "black" }}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  if (kind === "file") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls autoPlay style={{ width: "100%", maxHeight: "80vh", background: "black" }}>
        <source src={url} />
      </video>
    );
  }

  return (
    <div style={{ background: "white", padding: 32, textAlign: "center" }}>
      <p>This video can't be played directly here.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="button" style={{ display: "inline-block", marginTop: 16 }}>
        Open original link
      </a>
    </div>
  );
}