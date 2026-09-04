import type { ThemeMode } from "@/types/theme";

/**
 * Pure, total theme-resolution function implementing theme resolution
 * precedence (design Property 2 / Requirement 4.3):
 *
 * - If a valid stored preference ("light" or "dark") is present, it wins.
 * - Otherwise, fall back to the operating-system color-scheme preference.
 *
 * This function is intentionally pure and side-effect free so it can be
 * exhaustively property-tested. System preference is passed in as a boolean
 * rather than read here (see {@link getSystemPrefersDark}).
 */
export function resolveTheme(
  stored: ThemeMode | null | undefined,
  systemPrefersDark: boolean,
): ThemeMode {
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Reads the operating-system dark-mode preference. Not pure: touches the
 * `window`/`matchMedia` browser APIs, guarded for non-browser environments
 * (SSR, tests) where they may be unavailable. Kept separate from
 * {@link resolveTheme} so the resolution logic stays pure and testable.
 */
export function getSystemPrefersDark(): boolean {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

/**
 * Convenience wrapper that resolves the initial theme from a stored
 * preference combined with the current system preference.
 */
export function getInitialTheme(stored: ThemeMode | null): ThemeMode {
  return resolveTheme(stored, getSystemPrefersDark());
}
