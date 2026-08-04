/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

import { hasFunctionalConsent } from "@/lib/cookieConsent";

export type Theme = "default" | "purple" | "blue" | "green" | "orange" | "black-white";
export type Mode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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

  const [mode, setModeState] = useState<Mode>(() => {
    if (!hasFunctionalConsent()) {
      return "dark";
    }

    try {
      const savedMode = localStorage.getItem("app-mode");
      if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
        return savedMode;
      }
      return "dark";
    } catch {
      return "dark";
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

  const setMode = (newMode: Mode) => {
    setModeState(newMode);

    if (hasFunctionalConsent()) {
      try {
        localStorage.setItem("app-mode", newMode);
      } catch {
        // ignore storage access failures
      }
    }
  };

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const isDarkMode = mode === "dark" || (mode === "system" && systemIsDark);

  const toggleDarkMode = () => {
    setMode(isDarkMode ? "light" : "dark");
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all previous theme classes
    root.classList.remove("theme-default", "theme-purple", "theme-blue", "theme-green", "theme-orange", "theme-black-white");
    // Add new theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode, isDarkMode, toggleDarkMode }}>
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

