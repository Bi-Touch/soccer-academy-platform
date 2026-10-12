
export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  externalMedia: boolean;
  updatedAt: string;
  version: 2;
};

export type OptionalConsentCategory =
  | "analytics"
  | "marketing"
  | "externalMedia";

const STORAGE_KEY = "kickoasis-cookie-consent-v1";

export const CONSENT_CHANGED_EVENT = "kickoasis:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "kickoasis:open-cookie-settings";

export const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  externalMedia: false,
  updatedAt: "",
  version: 2,
};

/**
 * Returns saved preferences, or null when the visitor has not made
 * a valid choice. Do not interpret null as consent.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object") return null;

    const value = parsed as Record<string, unknown>;

    // Migrate the previous consent format. The old format did not
    // include external media, so that category remains disabled.
    if (
      value.version === 1 &&
      typeof value.analytics === "boolean" &&
      typeof value.marketing === "boolean"
    ) {
      const migrated: ConsentPreferences = {
        necessary: true,
        analytics: value.analytics,
        marketing: value.marketing,
        externalMedia: false,
        updatedAt:
          typeof value.updatedAt === "string" ? value.updatedAt : "",
        version: 2,
      };

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(migrated)
      );

      return migrated;
    }

    if (
      value.version === 2 &&
      typeof value.analytics === "boolean" &&
      typeof value.marketing === "boolean" &&
      typeof value.externalMedia === "boolean"
    ) {
      return {
        necessary: true,
        analytics: value.analytics,
        marketing: value.marketing,
        externalMedia: value.externalMedia,
        updatedAt:
          typeof value.updatedAt === "string" ? value.updatedAt : "",
        version: 2,
      };
    }

    return null;
  } catch {
    // If storage cannot be read, do not grant optional consent.
    return null;
  }
}

export function hasConsent(
  category: OptionalConsentCategory
): boolean {
  return getStoredConsent()?.[category] === true;
}

/**
 * Save the visitor's choices and notify components in this tab.
 * Storage events notify other tabs in the same origin.
 */
export function saveConsent(
  choices: Pick<
    ConsentPreferences,
    "analytics" | "marketing" | "externalMedia"
  >
): ConsentPreferences {
  const next: ConsentPreferences = {
    necessary: true,
    analytics: choices.analytics,
    marketing: choices.marketing,
    externalMedia: choices.externalMedia,
    updatedAt: new Date().toISOString(),
    version: 2,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The current page can continue, but consent may not persist
      // if browser storage is blocked or unavailable.
    }

    window.dispatchEvent(
      new CustomEvent<ConsentPreferences>(CONSENT_CHANGED_EVENT, {
        detail: next,
      })
    );
  }

  return next;
}

/**
 * Ask the CookieConsent component to open its settings dialog.
 */
export function requestCookieSettings(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/**
 * Dynamically load an optional script only while its consent category
 * is enabled. The returned cleanup removes the script element and
 * unregisters the listeners.
 *
 * Removing a script cannot reverse data already sent to a provider.
 * Provider-specific cleanup must be added when a provider is selected.
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

    const allowed = hasConsent(category);

    if (!allowed) {
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

  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      syncScript();
    }
  }

  window.addEventListener(CONSENT_CHANGED_EVENT, syncScript);
  window.addEventListener("storage", onStorage);
  syncScript();

  return () => {
    disposed = true;
    window.removeEventListener(CONSENT_CHANGED_EVENT, syncScript);
    window.removeEventListener("storage", onStorage);
    script?.remove();
    script = null;
  };
}