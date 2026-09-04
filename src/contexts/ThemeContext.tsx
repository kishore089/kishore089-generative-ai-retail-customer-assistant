/* eslint-disable react-refresh/only-export-components --
 * This context module intentionally co-locates the ThemeProvider component with
 * the useTheme hook. Splitting them would fragment the theme abstraction; Fast
 * Refresh is a dev-only concern that does not apply to these stable exports. */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ThemeContextValue, ThemeMode } from "@/types/theme";
import { getInitialTheme } from "@/utils/theme/resolveTheme";

/**
 * localStorage key under which the selected theme is persisted. The stored
 * value is exactly the `ThemeMode` string ("light" | "dark"), satisfying the
 * theme persistence round-trip (design Property 1 / Requirements 4.4, 4.5).
 */
const STORAGE_KEY = "app.theme";

/**
 * Reads and validates the persisted theme preference from localStorage.
 * Returns a valid `ThemeMode` or `null` when absent, invalid, or when
 * storage is unavailable (e.g. SSR, privacy modes).
 */
function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Persists the selected theme preference to localStorage. Failures (quota,
 * disabled storage) are swallowed so theming never breaks the app.
 */
function writeStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore persistence failures */
  }
}

/**
 * Applies the theme to the document root synchronously so the visual switch
 * happens within the same tick (well under the 200ms budget, Requirement 4.2):
 * toggles the `dark` class and mirrors the mode onto `data-theme`.
 */
function applyThemeToDom(mode: ThemeMode): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.setAttribute("data-theme", mode);
}

// Raw context is intentionally NOT exported — consumers use `useTheme`.
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    getInitialTheme(readStoredTheme()),
  );

  // Apply the theme to the DOM whenever the mode changes.
  useEffect(() => {
    applyThemeToDom(mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeStoredTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      writeStoredTheme(next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = { mode, setMode, toggle };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
