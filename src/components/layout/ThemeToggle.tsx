import { FiMoon, FiSun } from "react-icons/fi";

import { useTheme } from "@/contexts/ThemeContext";

/**
 * Icon button that toggles between light and dark themes.
 *
 * Shows a sun icon while in dark mode (click to go light) and a moon icon while
 * in light mode (click to go dark). Wired to {@link useTheme}'s `toggle`.
 */
export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {isDark ? (
        <FiSun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <FiMoon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
