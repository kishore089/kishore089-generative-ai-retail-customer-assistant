import { useCallback, useEffect, useState } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Typed `useState`-like hook that persists its value to `localStorage`.
 *
 * SSR-safe: guards `typeof window` and wraps all JSON parsing/serialization
 * in try/catch so malformed or unavailable storage never throws.
 *
 * @param key - The `localStorage` key to read from and write to.
 * @param initialValue - The value used when nothing is stored (or on error).
 * @returns A `[value, setValue]` tuple mirroring the `useState` shape.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback<SetValue<T>>(
    (value) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch {
            // Ignore write failures (e.g. storage full or unavailable).
          }
        }

        return nextValue;
      });
    },
    [key],
  );

  // Re-read when the key changes so the value stays consistent with the
  // external localStorage store. This one-time re-sync on key change is the
  // intended subscribe-and-sync use of effects.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external store re-sync on key change
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue];
}
