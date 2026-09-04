/**
 * Auth bridge — decouples the HTTP client from the React Auth context.
 *
 * The HTTP client must NOT import the React `AuthContext` directly: doing so
 * would create a circular dependency (context -> services -> http client ->
 * context). Instead, the `AuthProvider` injects a small bridge implementation
 * at runtime via {@link setAuthBridge}, and the HTTP client reads through the
 * accessor functions below.
 *
 * Design: HTTP Client (Auth integration). Requirements: 10.3, 10.4, 10.5.
 */

export interface AuthBridge {
  /** Returns the current auth token, or `null` when unauthenticated. */
  getToken: () => string | null;
  /** Signs the current user out (clearing session state). */
  signOut: () => Promise<void>;
}

/**
 * Module-level bridge instance. `null` until an `AuthProvider` wires itself in
 * (or after it unmounts and calls `setAuthBridge(null)`).
 */
let bridge: AuthBridge | null = null;

/** Register (or clear, with `null`) the active {@link AuthBridge}. */
export function setAuthBridge(b: AuthBridge | null): void {
  bridge = b;
}

/** Read the current auth token via the bridge, or `null` when unavailable. */
export function getAuthToken(): string | null {
  return bridge?.getToken() ?? null;
}

/** Sign out via the bridge. No-op when no bridge is registered. */
export async function authSignOut(): Promise<void> {
  if (bridge) {
    await bridge.signOut();
  }
}
