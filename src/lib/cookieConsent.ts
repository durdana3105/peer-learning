/** Cookie category identifiers used for consent preferences. */
export type CookieCategory = "essential" | "analytics" | "functional" | "marketing";

/** Persisted cookie consent preferences for the current user. */
export interface CookiePreferences {
  version: number;
  consentGiven: boolean;
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
}

/** Toggleable non-essential cookie category preferences. */
export type CookieCategoryPreferences = Pick<
  CookiePreferences,
  "analytics" | "functional" | "marketing"
>;

const STORAGE_KEY = "peerlearn_cookie_consent";
const CURRENT_VERSION = 1;

const FUNCTIONAL_STORAGE_KEYS = [
  "app-theme",
  "peerlearn_mode",
  "pl_streak",
  "pl_last_active",
  "pl_streak_cache",
] as const;

const createPreferences = (
  categories: CookieCategoryPreferences,
  consentGiven = true,
): CookiePreferences => ({
  version: CURRENT_VERSION,
  consentGiven,
  essential: true,
  analytics: categories.analytics,
  functional: categories.functional,
  marketing: categories.marketing,
  timestamp: new Date().toISOString(),
});

const parseStoredConsent = (raw: string | null): CookiePreferences | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== CURRENT_VERSION || !parsed.consentGiven) {
      return null;
    }

    return {
      ...parsed,
      essential: true,
    };
  } catch {
    return null;
  }
};

const readConsentFromStorage = (storage: Storage): CookiePreferences | null => {
  try {
    return parseStoredConsent(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

/** Read stored consent from sessionStorage, falling back to localStorage. */
export const getStoredConsent = (): CookiePreferences | null => {
  return (
    readConsentFromStorage(sessionStorage) ?? readConsentFromStorage(localStorage)
  );
};

/** Persist consent preferences without throwing if storage is unavailable. */
export const saveConsent = (prefs: CookiePreferences): void => {
  const serialized = JSON.stringify(prefs);

  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage access failures
    }
    return;
  } catch {
    // fall through to sessionStorage
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, serialized);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage access failures
    }
  } catch {
    console.warn("[cookieConsent] Unable to persist consent preferences.");
  }
};

/** Returns true when the user has granted functional cookie consent. */
export const hasFunctionalConsent = (): boolean =>
  getStoredConsent()?.functional === true;

/** Remove functional localStorage entries when consent is revoked. */
export const clearFunctionalStorage = (): void => {
  for (const key of FUNCTIONAL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage access failures
    }
  }
};

/** Build preferences that accept all non-essential cookie categories. */
export const acceptAllPreferences = (): CookiePreferences =>
  createPreferences({
    analytics: true,
    functional: true,
    marketing: true,
  });

/** Build preferences that reject all non-essential cookie categories. */
export const rejectNonEssentialPreferences = (): CookiePreferences =>
  createPreferences({
    analytics: false,
    functional: false,
    marketing: false,
  });

/** Build preferences from custom non-essential category choices. */
export const saveCustomPreferences = (
  categories: CookieCategoryPreferences,
): CookiePreferences => createPreferences(categories);

/** Default non-essential category preferences (all disabled). */
export const defaultCategoryPreferences = (): CookieCategoryPreferences => ({
  analytics: false,
  functional: false,
  marketing: false,
});
