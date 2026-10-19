/**
 * Website visitor cookie/tracking consent.
 *
 * NOTE: this covers browser cookies and scripts only. Parent consents for
 * players (photos, scouting, health data, etc.) are stored per player in the
 * database (see schema-additions.prisma), not here.
 */

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  externalMedia: boolean;
  updatedAt: string;
  version: 3;
  /** Privacy policy version the visitor agreed under. */
  policyVersion: string;
  /** Random id that links server log entries to this browser. Not personal data. */
  visitorId: string;
};

export type OptionalConsentCategory =
  | "analytics"
  | "marketing"
  | "externalMedia";

export type ConsentAction = "accept_all" | "reject_all" | "custom";

/**
 * Change this whenever the privacy policy or cookie list changes in a way
 * that needs fresh consent. It should match the "Last updated" date on the
 * privacy page. Everyone is re-prompted when it changes.
 */
export const CONSENT_POLICY_VERSION = "2026-09-28";

/** Ask visitors again after this long. */
const CONSENT_MAX_AGE_DAYS = 365;
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// Key kept the same as before so existing choices can still be read and migrated.
const STORAGE_KEY = "kickoasis-cookie-consent-v1";

/** Best-effort audit log endpoint (POST). Set to null to disable. */
const CONSENT_LOG_ENDPOINT: string | null = "/api/consent-log";

export const CONSENT_CHANGED_EVENT = "kickoasis:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "kickoasis:open-cookie-settings";

export const defaultChoices = {
  analytics: false,
  marketing: false,
  externalMedia: false,
} as const;

/**
 * Cookies to delete when a category is switched off.
 * Fill this in when you choose providers. A trailing * matches a prefix.
 * Deleting cookies does not recall data already sent to a provider.
 */
const COOKIE_REGISTRY: Record<OptionalConsentCategory, string[]> = {
  analytics: [], // e.g. "_ga", "_ga_*"
  marketing: [], // e.g. "_fbp"
  externalMedia: [], // e.g. YouTube cookies if you embed videos
};

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

function parse(raw: string | null): ConsentPreferences | null {
  if (!raw) return null;

  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    const value = v as Record<string, unknown>;

    if (value.version !== 1 && value.version !== 2 && value.version !== 3) {
      return null;
    }
    if (
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) {
      return null;
    }

    return {
      necessary: true,
      analytics: value.analytics,
      marketing: value.marketing,
      // Version 1 had no external media category: it stays off.
      externalMedia: value.version === 1 ? false : value.externalMedia === true,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
      version: 3,
      // Older records have no policy version, so they will be re-prompted.
      policyVersion:
        typeof value.policyVersion === "string" ? value.policyVersion : "",
      visitorId: typeof value.visitorId === "string" ? value.visitorId : "",
    };
  } catch {
    return null;
  }
}

// Cache so the same object is returned until storage changes. This keeps
// React's useSyncExternalStore from re-rendering in a loop.
let cachedRaw: string | null | undefined;
let cachedValue: ConsentPreferences | null = null;

/**
 * Returns the saved preferences, or null when the visitor has no valid saved
 * choice. Null is never consent. A returned record may be out of date; use
 * needsConsentPrompt() or hasConsent() to check.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked: do not grant optional consent
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

function isCurrent(consent: ConsentPreferences): boolean {
  if (consent.policyVersion !== CONSENT_POLICY_VERSION) return false;

  const savedAt = Date.parse(consent.updatedAt);
  if (Number.isNaN(savedAt)) return false;

  return Date.now() - savedAt < CONSENT_MAX_AGE_MS;
}

/** True when the banner should be shown (no choice, outdated policy, or expired). */
export function needsConsentPrompt(): boolean {
  const consent = getStoredConsent();
  return !consent || !isCurrent(consent);
}

/** Optional categories are only allowed while the saved choice is current. */
export function hasConsent(category: OptionalConsentCategory): boolean {
  const consent = getStoredConsent();
  return !!consent && isCurrent(consent) && consent[category] === true;
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

function newVisitorId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deleteCookie(name: string): void {
  const expire = "Max-Age=0; path=/";

  if (name.endsWith("*")) {
    const prefix = name.slice(0, -1);
    document.cookie.split(";").forEach((pair) => {
      const cookieName = pair.split("=")[0].trim();
      if (cookieName.startsWith(prefix)) deleteCookie(cookieName);
    });
    return;
  }

  document.cookie = `${name}=; ${expire}`;
  const host = window.location.hostname;
  document.cookie = `${name}=; ${expire}; domain=${host}`;
  document.cookie = `${name}=; ${expire}; domain=.${host}`;
}

function clearCategoryCookies(category: OptionalConsentCategory): void {
  if (typeof document === "undefined") return;
  COOKIE_REGISTRY[category].forEach(deleteCookie);
}

function logConsent(consent: ConsentPreferences, action: ConsentAction): void {
  if (!CONSENT_LOG_ENDPOINT || typeof fetch === "undefined") return;

  try {
    void fetch(CONSENT_LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: consent.visitorId,
        analytics: consent.analytics,
        marketing: consent.marketing,
        externalMedia: consent.externalMedia,
        policyVersion: consent.policyVersion,
        action,
        clientTimestamp: consent.updatedAt,
      }),
    }).catch(() => {
      // Logging is best-effort and must never block the visitor.
    });
  } catch {
    // ignore
  }
}

/**
 * Save the visitor's choices, clean up anything they switched off,
 * log the decision, and notify components in this tab.
 */
export function saveConsent(
  choices: Pick<
    ConsentPreferences,
    "analytics" | "marketing" | "externalMedia"
  >,
  action: ConsentAction = "custom"
): ConsentPreferences {
  const previous = getStoredConsent();

  const next: ConsentPreferences = {
    necessary: true,
    analytics: choices.analytics,
    marketing: choices.marketing,
    externalMedia: choices.externalMedia,
    updatedAt: new Date().toISOString(),
    version: 3,
    policyVersion: CONSENT_POLICY_VERSION,
    visitorId: previous?.visitorId || newVisitorId(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The page keeps working, but the choice may not persist.
    }

    (["analytics", "marketing", "externalMedia"] as const).forEach((cat) => {
      if (!next[cat]) clearCategoryCookies(cat);
    });

    logConsent(next, action);

    window.dispatchEvent(
      new CustomEvent<ConsentPreferences>(CONSENT_CHANGED_EVENT, {
        detail: next,
      })
    );
  }

  return next;
}

export function acceptAll(): ConsentPreferences {
  return saveConsent(
    { analytics: true, marketing: true, externalMedia: true },
    "accept_all"
  );
}

/** Rejecting must be as easy as accepting: give it the same prominence. */
export function rejectAll(): ConsentPreferences {
  return saveConsent({ ...defaultChoices }, "reject_all");
}

/** Ask the CookieConsent component to open its settings dialog. */
export function requestCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/* ------------------------------------------------------------------ */
/* Subscriptions (for React: useSyncExternalStore)                      */
/* ------------------------------------------------------------------ */

export function subscribeConsent(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };

  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/* ------------------------------------------------------------------ */
/* Consent-gated scripts                                                */
/* ------------------------------------------------------------------ */

/**
 * Load an optional script only while its category is allowed.
 * The returned cleanup removes the script and its listeners.
 *
 * Removing a script cannot reverse data already sent to a provider.
 * Add provider-specific opt-out calls when you choose a provider.
 */
export function mountConsentGatedScript(
  category: "analytics" | "marketing",
  src: string,
  id: string
): () => void {
  if (typeof window === "undefined") return () => {};

  let script: HTMLScriptElement | null = null;
  let disposed = false;

  function syncScript() {
    if (disposed) return;

    if (!hasConsent(category)) {
      script?.remove();
      script = null;
      return;
    }

    if (script || document.getElementById(id)) return;

    const element = document.createElement("script");
    element.id = id;
    element.src = src;
    element.async = true;
    element.dataset.consentCategory = category;

    script = element;
    document.head.appendChild(element);
  }

  const unsubscribe = subscribeConsent(syncScript);
  syncScript();

  return () => {
    disposed = true;
    unsubscribe();
    script?.remove();
    script = null;
  };
}