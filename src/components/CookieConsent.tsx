"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  acceptAll,
  defaultChoices,
  getStoredConsent,
  needsConsentPrompt,
  rejectAll,
  saveConsent,
  subscribeConsent,
} from "@/lib/consent";

type Choices = {
  analytics: boolean;
  marketing: boolean;
  externalMedia: boolean;
};

/** Saved choices when still valid, otherwise everything off. */
function currentChoices(): Choices {
  const stored = getStoredConsent();
  if (!stored || needsConsentPrompt()) return { ...defaultChoices };

  return {
    analytics: stored.analytics,
    marketing: stored.marketing,
    externalMedia: stored.externalMedia,
  };
}

const buttonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 160ms ease, border-color 160ms ease",
};

const categoryRowStyle: CSSProperties = {
  padding: "14px 0",
  borderBottom: "1px solid #e5e7eb",
};

const categoryLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const descriptionStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 400,
  color: "#6b7280",
  marginTop: 5,
  lineHeight: 1.55,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#14532d",
  borderColor: "#14532d",
  color: "#ffffff",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#374151",
  borderColor: "#d1d5db",
};

export default function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [choices, setChoices] = useState<Choices>({ ...defaultChoices });

  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openSettings = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setChoices(currentChoices());
    setManageOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setChoices(currentChoices());
    setManageOpen(false);
    returnFocusRef.current?.focus?.();
  }, []);

  // Initial state, plus reacting to changes in this tab and other tabs.
  useEffect(() => {
    function sync() {
      setVisible(needsConsentPrompt());
      setChoices(currentChoices());
    }

    sync();
    setReady(true);

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    const unsubscribe = subscribeConsent(sync);

    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
      unsubscribe();
    };
  }, [openSettings]);

  // Dialog: Escape to close, keep Tab inside, lock page scroll.
  useEffect(() => {
    if (!manageOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
        return;
      }

      if (event.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;

      const focusable = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [manageOpen, closeSettings]);

  function handleAcceptAll() {
    acceptAll();
    setVisible(false);
    setManageOpen(false);
  }

  function handleRejectAll() {
    rejectAll();
    setVisible(false);
    setManageOpen(false);
  }

  function handleSaveChoices() {
    saveConsent(choices, "custom");
    setVisible(false);
    setManageOpen(false);
  }

  if (!ready) return null;

  return (
    <>
      <style>{`
        .ko-cookie *,
        .ko-cookie *::before,
        .ko-cookie *::after {
          box-sizing: border-box;
        }

        .ko-cookie button,
        .ko-cookie input,
        .ko-cookie a {
          -webkit-tap-highlight-color: transparent;
        }

        .ko-cookie button:focus-visible,
        .ko-cookie a:focus-visible,
        .ko-cookie input:focus-visible {
          outline: 3px solid #d4a72c;
          outline-offset: 3px;
        }

        .ko-cookie-dialog:focus {
          outline: none;
        }

        .ko-cookie-trigger {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 9998;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-width: 46px;
          height: 46px;
          padding: 0 12px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          background: #ffffff;
          color: #14532d;
          box-shadow: 0 3px 14px rgba(15, 23, 42, 0.13);
          cursor: pointer;
          transition: background 160ms ease, box-shadow 160ms ease,
            border-color 160ms ease;
        }

        .ko-cookie-trigger:hover {
          background: #f0fdf4;
          border-color: #bbd7c3;
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.17);
        }

        .ko-cookie-trigger-label {
          display: none;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .ko-cookie-trigger:hover .ko-cookie-trigger-label,
        .ko-cookie-trigger:focus-visible .ko-cookie-trigger-label {
          display: inline;
        }

        .ko-cookie-banner {
          position: fixed;
          z-index: 10000;
          right: 16px;
          bottom: 16px;
          left: 16px;
          max-height: min(80vh, 560px);
          overflow-y: auto;
          padding: 22px 24px;
          border: 1px solid #e5e7eb;
          border-top: 3px solid #d4a72c;
          border-radius: 14px;
          background: #ffffff;
          color: #111827;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.16);
        }

        .ko-cookie-banner-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          max-width: 1120px;
          margin: 0 auto;
        }

        .ko-cookie-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .ko-cookie-dialog {
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 26px;
          border: 1px solid #e5e7eb;
          border-top: 4px solid #d4a72c;
          border-radius: 16px;
          background: #ffffff;
          color: #111827;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
        }

        .ko-cookie-dialog input[type="checkbox"] {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          accent-color: #14532d;
          cursor: pointer;
        }

        .ko-cookie-dialog input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }

        .ko-cookie-modal-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 22px;
        }

        .ko-cookie button:disabled {
          opacity: 0.7;
        }

        @media (max-width: 640px) {
          .ko-cookie-trigger {
            right: 12px;
            bottom: 12px;
            min-width: 44px;
            height: 44px;
          }

          .ko-cookie-banner {
            right: 8px;
            bottom: 8px;
            left: 8px;
            max-height: 85vh;
            padding: 18px;
            border-radius: 12px;
          }

          .ko-cookie-banner-inner {
            gap: 16px;
          }

          .ko-cookie-actions {
            display: grid;
            grid-template-columns: 1fr;
            width: 100%;
          }

          .ko-cookie-actions button {
            width: 100%;
          }

          .ko-cookie-dialog {
            padding: 20px;
            max-height: 88vh;
          }

          .ko-cookie-modal-actions button {
            flex: 1 1 auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ko-cookie-trigger,
          .ko-cookie button {
            transition: none;
          }
        }
      `}</style>

      <div className="ko-cookie">
        {visible && (
          <section
            aria-label="Cookie consent"
            aria-describedby="cookie-consent-description"
            className="ko-cookie-banner"
          >
            <div className="ko-cookie-banner-inner">
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: 19,
                    lineHeight: 1.35,
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    margin: "0 0 8px",
                    color: "#14532d",
                  }}
                >
                  Your privacy matters
                </h2>

                <p
                  id="cookie-consent-description"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "#4b5563",
                    margin: 0,
                  }}
                >
                  KickOasis uses necessary browser storage for essential
                  functions. With your permission, we may also use analytics,
                  advertising technologies, and external media such as YouTube
                  and Vimeo. You can reject optional categories or change your
                  choices at any time. We will ask again after 12 months or if
                  our policy changes. Read our{" "}
                  <a
                    href="/privacy-policy"
                    style={{
                      color: "#166534",
                      fontWeight: 600,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="ko-cookie-actions">
                {/* Reject and Accept carry equal visual weight on purpose. */}
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleRejectAll}
                >
                  Reject Non-Essential
                </button>

                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={openSettings}
                >
                  Manage Preferences
                </button>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleAcceptAll}
                >
                  Accept All
                </button>
              </div>
            </div>
          </section>
        )}

        {!visible && (
          <button
            type="button"
            onClick={openSettings}
            aria-label="Open cookie settings"
            title="Cookie Settings"
            className="ko-cookie-trigger"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3a2.5 2.5 0 0 0 3.5 3.5A2.5 2.5 0 0 0 19 10a8.5 8.5 0 1 1-7-7Z" />
              <circle cx="8.5" cy="12" r="1" />
              <circle cx="12" cy="16" r="1" />
              <circle cx="7.5" cy="8" r="1" />
            </svg>
            <span className="ko-cookie-trigger-label">Cookie Settings</span>
          </button>
        )}

        {manageOpen && (
          <div
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeSettings();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(10, 25, 17, 0.58)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
            }}
          >
            <section
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-settings-title"
              className="ko-cookie-dialog ko-cookie"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#927018",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    KICKOASIS · PRIVACY
                  </p>

                  <h2
                    id="cookie-settings-title"
                    style={{
                      margin: 0,
                      fontSize: 23,
                      lineHeight: 1.3,
                      letterSpacing: "-0.03em",
                      color: "#14532d",
                    }}
                  >
                    Cookie preferences
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeSettings}
                  aria-label="Close cookie preferences"
                  title="Close"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 36px",
                    width: 36,
                    height: 36,
                    border: "1px solid #e5e7eb",
                    borderRadius: 9,
                    background: "#ffffff",
                    color: "#4b5563",
                    cursor: "pointer",
                    fontSize: 21,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  lineHeight: 1.7,
                  margin: "10px 0 18px",
                }}
              >
                Choose which optional categories you allow. You can change
                these choices at any time using the Cookie Settings button.
              </p>

              <div style={categoryRowStyle}>
                <label style={categoryLabelStyle}>
                  <span style={{ minWidth: 0 }}>
                    Necessary
                    <span style={descriptionStyle}>
                      Essential security and site functionality.
                    </span>
                  </span>
                  <input type="checkbox" checked disabled />
                </label>
              </div>

              <div style={categoryRowStyle}>
                <label style={categoryLabelStyle}>
                  <span style={{ minWidth: 0 }}>
                    Analytics
                    <span style={descriptionStyle}>
                      Measurement of website usage and performance.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={choices.analytics}
                    onChange={(event) =>
                      setChoices((current) => ({
                        ...current,
                        analytics: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>

              <div style={categoryRowStyle}>
                <label style={categoryLabelStyle}>
                  <span style={{ minWidth: 0 }}>
                    Marketing
                    <span style={descriptionStyle}>
                      Advertising pixels, conversion measurement, and
                      remarketing technologies.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={choices.marketing}
                    onChange={(event) =>
                      setChoices((current) => ({
                        ...current,
                        marketing: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>

              <div
                style={{
                  ...categoryRowStyle,
                  borderBottom: "none",
                }}
              >
                <label style={categoryLabelStyle}>
                  <span style={{ minWidth: 0 }}>
                    External media
                    <span style={descriptionStyle}>
                      Embedded YouTube, Vimeo, and other externally hosted
                      video content. The provider may receive technical data
                      when the content loads.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={choices.externalMedia}
                    onChange={(event) =>
                      setChoices((current) => ({
                        ...current,
                        externalMedia: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="ko-cookie-modal-actions">
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={closeSettings}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleSaveChoices}
                >
                  Save Preferences
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}