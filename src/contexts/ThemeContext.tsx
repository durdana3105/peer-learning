import React, { createContext, useContext, useEffect, useState } from "react";

import { hasFunctionalConsent } from "@/lib/cookieConsent";

export type Theme = "default" | "purple" | "blue" | "green" | "orange" | "black-white";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!hasFunctionalConsent()) {
      return "default";
    }

    try {
      return (localStorage.getItem("app-theme") as Theme) || "default";
    } catch {
      return "default";
    }
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    if (hasFunctionalConsent()) {
      try {
        localStorage.setItem("app-theme", newTheme);
      } catch {
        // ignore storage access failures
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all previous theme classes
    root.classList.remove("theme-default", "theme-purple", "theme-blue", "theme-green", "theme-orange","theme-black-white");
    // Add new theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
