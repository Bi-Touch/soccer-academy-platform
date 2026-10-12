
"use client";

import { useEffect, useState } from "react";
import { getVideoKind, getEmbedUrl } from "@/lib/video";
import {
  CONSENT_CHANGED_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  getStoredConsent,
} from "@/lib/consent";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
};

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function ExternalMediaPrompt({
  title,
  consentGranted,
  onLoad,
}: {
  title: string;
  consentGranted: boolean;
  onLoad: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#111827",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 58,
          height: 58,
          flexShrink: 0,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 0,
            height: 0,
            borderTop: "11px solid transparent",
            borderBottom: "11px solid transparent",
            borderLeft: "17px solid #166534",
            marginLeft: 4,
          }}
        />
      </div>

      <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{title}</p>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#d1d5db",
          margin: "0 0 18px",
          maxWidth: 420,
        }}
      >
        {consentGranted
          ? "This video is hosted externally. Load it when you are ready to connect to the provider."
          : "This video is hosted externally. Allow external media in your cookie preferences before connecting to the provider."}
      </p>

      <button
        type="button"
        onClick={onLoad}
        style={{
          padding: "11px 20px",
          borderRadius: 8,
          border: "none",
          background: "#166534",
          color: "#ffffff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {consentGranted
          ? "Load and Play Video"
          : "Manage Cookie Settings"}
      </button>
    </div>
  );
}

export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [externalMediaConsent, setExternalMediaConsent] = useState(false);

  const open = openIndex !== null ? videos[openIndex] ?? null : null;

  useEffect(() => {
    function syncConsent() {
      setExternalMediaConsent(
        getStoredConsent()?.externalMedia === true
      );
    }

    syncConsent();

    window.addEventListener(CONSENT_CHANGED_EVENT, syncConsent);
    window.addEventListener("storage", syncConsent);

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  function canRequestThumbnail(url: string | null): boolean {
    if (!url) return false;

    // Relative paths are treated as same-site assets. Absolute HTTP(S)
    // URLs are treated as external until external-media consent exists.
    if (url.startsWith("/") && !url.startsWith("//")) return true;
    if (!isAbsoluteHttpUrl(url)) return true;

    return externalMediaConsent;
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {videos.map((video, i) => {
          const showThumbnail = canRequestThumbnail(video.thumbnailUrl);

          return (
            <button
              key={video.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Play ${video.title}`}
              style={{
                textAlign: "left",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  background:
                    showThumbnail && video.thumbnailUrl
                      ? `url("${video.thumbnailUrl}") center/cover`
                      : "var(--pitch-dark)",
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

              <div
                style={{
                  padding: "8px 0",
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {video.title}
              </div>
            </button>
          );
        })}
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
            onClick={(event) => event.stopPropagation()}
            style={{ width: "100%", maxWidth: 900 }}
          >
            <VideoPlayer
              url={open.url}
              title={open.title}
              externalMediaConsent={externalMediaConsent}
            />

            <p
              style={{
                color: "var(--chalk)",
                marginTop: 12,
                fontSize: "0.95rem",
              }}
            >
              {open.title}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close video"
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

function VideoPlayer({
  url,
  title,
  externalMediaConsent,
}: {
  url: string;
  title: string;
  externalMediaConsent: boolean;
}) {
  const [externalVideoEnabled, setExternalVideoEnabled] = useState(false);

  useEffect(() => {
    // Require a fresh click after a consent change.
    setExternalVideoEnabled(false);
  }, [externalMediaConsent, url]);

  const kind = getVideoKind(url);
  const embedUrl = getEmbedUrl(url);

  function requestOrLoadVideo() {
    if (!externalMediaConsent) {
      window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
      return;
    }

    setExternalVideoEnabled(true);
  }

  if ((kind === "youtube" || kind === "vimeo") && embedUrl) {
    const privacyEnhancedUrl = embedUrl.replace(
      "https://www.youtube.com/embed/",
      "https://www.youtube-nocookie.com/embed/"
    );

    if (!externalMediaConsent || !externalVideoEnabled) {
      return (
        <ExternalMediaPrompt
          title={title}
          consentGranted={externalMediaConsent}
          onLoad={requestOrLoadVideo}
        />
      );
    }

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          background: "black",
        }}
      >
        <iframe
          src={privacyEnhancedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    );
  }

  if (kind === "file") {
    const externalFile = isAbsoluteHttpUrl(url);

    if (externalFile && (!externalMediaConsent || !externalVideoEnabled)) {
      return (
        <ExternalMediaPrompt
          title={title}
          consentGranted={externalMediaConsent}
          onLoad={requestOrLoadVideo}
        />
      );
    }

    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        controls
        autoPlay
        style={{
          width: "100%",
          maxHeight: "80vh",
          background: "black",
        }}
      >
        <source src={url} />
        Your browser does not support this video.
      </video>
    );
  }

  return (
    <div
      style={{
        background: "white",
        padding: 32,
        textAlign: "center",
      }}
    >
      <p>This video can't be played directly here.</p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="button"
        style={{
          display: "inline-block",
          marginTop: 16,
        }}
      >
        Open original link
      </a>
    </div>
  );
}