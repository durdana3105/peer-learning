import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

// Test component to consume useTheme
const TestComponent = () => {
  const { mode, isDarkMode, toggleDarkMode, setMode, theme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="isDarkMode">{isDarkMode ? "true" : "false"}</span>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleDarkMode}>
        Toggle
      </button>
      <button data-testid="set-light" onClick={() => setMode("light")}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setMode("dark")}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setMode("system")}>
        Set System
      </button>
      <button data-testid="set-purple" onClick={() => setTheme("purple")}>
        Set Purple
      </button>
    </div>
  );
};

describe("ThemeContext & Dark Mode Toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("provides default dark mode and applies dark class to root", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(screen.getByTestId("isDarkMode").textContent).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to 'dark' mode when localStorage contains a malformed app-mode string", () => {
    localStorage.setItem("peerlearn_cookie_consent", JSON.stringify({ version: 1, consentGiven: true, functional: true }));
    localStorage.setItem("app-mode", "invalid_stale_mode");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("restores valid app-mode from localStorage when consent is granted", () => {
    localStorage.setItem("peerlearn_cookie_consent", JSON.stringify({ version: 1, consentGiven: true, functional: true }));
    localStorage.setItem("app-mode", "light");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("toggles dark mode off (to light mode)", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("toggle"));

    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(screen.getByTestId("isDarkMode").textContent).toBe("false");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("sets dark mode explicitly using setMode", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-light"));
    expect(screen.getByTestId("mode").textContent).toBe("light");

    fireEvent.click(screen.getByTestId("set-dark"));
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("supports system preference mode", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-system"));
    expect(screen.getByTestId("mode").textContent).toBe("system");
  });

  it("updates color preset theme and applies theme class", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-purple"));
    expect(screen.getByTestId("theme").textContent).toBe("purple");
    expect(document.documentElement.classList.contains("theme-purple")).toBe(true);
  });
});
