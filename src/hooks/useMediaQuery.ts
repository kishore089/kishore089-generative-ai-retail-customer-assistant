import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query and report whether it currently matches.
 *
 * SSR-safe: guards `typeof window` so it returns `false` when `window` or
 * `matchMedia` is unavailable (e.g. during server-side rendering).
 *
 * @param query - A media query string, e.g. "(max-width: 767px)".
 * @returns `true` when the query currently matches, otherwise `false`.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Sync in case the query changed between render and effect. Reading the
    // live match state from the external matchMedia store is exactly the
    // subscribe-and-sync pattern effects are meant for.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external store re-sync on query change
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook for the `md` breakpoint used to drive sidebar collapse.
 *
 * @returns `true` when the viewport is at or below the mobile breakpoint.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
