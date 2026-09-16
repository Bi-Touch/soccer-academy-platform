"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export function GalleryGrid({ photos }: { photos: { id: string; url: string; caption: string | null }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const showPrev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const showNext = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") setOpenIndex(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openIndex, showPrev, showNext]);

  const arrowButtonStyle = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(245,243,238,0.4)",
    color: "var(--chalk)",
    fontSize: "1.4rem",
    width: 48,
    height: 48,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <>
      <div className="gallery-grid" style={{ display: "grid", gap: 16 }}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setOpenIndex(i)}
            style={{ border: "none", padding: 0, cursor: "pointer", background: "none", position: "relative", aspectRatio: "4/3", width: "100%", minWidth: 0 }}
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? ""}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 480px) 50vw, (max-width: 900px) 33vw, 20vw"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
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
            cursor: "zoom-out",
          }}
        >
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous photo"
              style={{ ...arrowButtonStyle, left: 24 }}
            >
              &#8249;
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[openIndex].url}
            alt={photos[openIndex].caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", cursor: "default" }}
          />
          {photos[openIndex].caption && (
            <p style={{ color: "var(--chalk)", marginTop: 16, fontSize: "0.9rem" }}>{photos[openIndex].caption}</p>
          )}

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next photo"
              style={{ ...arrowButtonStyle, right: 24 }}
            >
              &#8250;
            </button>
          )}

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