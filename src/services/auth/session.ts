/**
 * Session persistence helpers (pure, total, SSR-safe).
 *
 * Read/write a `PersistedSession` to `localStorage` under a fixed key. Every
 * function is total: it never throws, guarding both the absence of a DOM
 * (`typeof window`) and malformed/structurally-invalid stored data. Reading a
 * malformed value yields `null` (treated as unauthenticated by callers).
 *
 * Requirements: 13.1, 13.2, 13.4.
 */

import type { Role } from "@/types/user";

const SESSION_KEY = "app.session";

export interface PersistedSession {
  status: "authenticated";
  role: Role;
  userId: string;
  customerId: string | null;
}

/** Serialize a session to its JSON string form. */
export function serialize(session: PersistedSession): string {
  return JSON.stringify(session);
}

/** Structurally validate an unknown value as a `PersistedSession`. */
function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.status !== "authenticated") return false;
  if (record.role !== "Customer" && record.role !== "Admin") return false;
  if (typeof record.userId !== "string") return false;
  if (record.customerId !== null && typeof record.customerId !== "string") {
    return false;
  }
  return true;
}

/**
 * Parse a raw string into a `PersistedSession`, or `null` on any failure
 * (absent input, invalid JSON, or structurally invalid object). Never throws.
 */
export function parse(raw: string | null): PersistedSession | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isPersistedSession(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persist a session. Silently no-ops when storage is unavailable. */
export function writeSession(session: PersistedSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, serialize(session));
  } catch {
    // Ignore quota / access errors — persistence is best-effort.
  }
}

/** Read the persisted session, or `null` if absent/malformed. Never throws. */
export function readSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parse(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

/** Remove any persisted session. Silently no-ops when storage is unavailable. */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore access errors.
  }
}
