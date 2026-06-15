import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  acceptAllPreferences,
  clearFunctionalStorage,
  defaultCategoryPreferences,
  getStoredConsent,
  rejectNonEssentialPreferences,
  saveConsent,
  saveCustomPreferences,
  type CookieCategoryPreferences,
  type CookiePreferences,
} from "@/lib/cookieConsent";

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  hasConsent: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustomPreferences: (categories: CookieCategoryPreferences) => void;
  openPreferences: () => void;
  closeBanner: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(
  undefined,
);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(() =>
    getStoredConsent(),
  );
  const [showBanner, setShowBanner] = useState(() => !getStoredConsent());

  const persistPreferences = useCallback((prefs: CookiePreferences) => {
    saveConsent(prefs);
    if (!prefs.functional) {
      clearFunctionalStorage();
    }
    setPreferences(prefs);
    setShowBanner(false);
  }, []);

  const acceptAll = useCallback(() => {
    persistPreferences(acceptAllPreferences());
  }, [persistPreferences]);

  const rejectNonEssential = useCallback(() => {
    persistPreferences(rejectNonEssentialPreferences());
  }, [persistPreferences]);

  const saveCustom = useCallback(
    (categories: CookieCategoryPreferences) => {
      persistPreferences(saveCustomPreferences(categories));
    },
    [persistPreferences],
  );

  const openPreferences = useCallback(() => {
    setShowBanner(true);
  }, []);

  const closeBanner = useCallback(() => {
    if (preferences?.consentGiven) {
      setShowBanner(false);
    }
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      hasConsent: Boolean(preferences?.consentGiven),
      showBanner,
      acceptAll,
      rejectNonEssential,
      saveCustomPreferences: saveCustom,
      openPreferences,
      closeBanner,
    }),
    [
      preferences,
      showBanner,
      acceptAll,
      rejectNonEssential,
      saveCustom,
      openPreferences,
      closeBanner,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
};

export { defaultCategoryPreferences };
