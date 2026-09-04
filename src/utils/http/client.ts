/**
 * Shared Axios HTTP client singleton.
 *
 * Exposes a single, pre-configured Axios instance used by every service. It
 * attaches the auth token (when available) on outgoing requests and handles
 * auth expiry (401/403) on responses by signing the user out. It never talks to
 * the React Auth context directly — see {@link ./authBridge}.
 *
 * Design: HTTP Client, Error Handling (Property 5 — auth header attachment;
 * Property 6 — error normalization totality). Requirements: 10.1–10.7.
 */

import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";

import { env } from "@/config/env";

import { getAuthToken, authSignOut } from "./authBridge";
import { normalizeError } from "./normalizeError";

/** localStorage keys cleared as a best-effort fallback when signOut fails. */
const AUTH_STORAGE_KEYS = ["auth", "authToken", "token", "user"] as const;

/**
 * Pure helper: return `config` with an `Authorization: Bearer <token>` header
 * set IFF `token` is truthy, leaving all other fields untouched.
 *
 * Extracted as a standalone, side-effect-free function so it can be
 * property-tested independently of Axios (Property 5).
 */
export function applyAuthHeader<T extends { headers?: Record<string, unknown> }>(
  config: T,
  token: string | null,
): T {
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

/** The shared, pre-configured Axios instance. */
const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor: attach the Authorization header when a token is present
// (Property 5). When there is no token, the config is returned unchanged.
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  return applyAuthHeader(config, token);
});

// Response interceptor.
//
// Success: return the response AS-IS. The design mentions returning
// `response.data`, but unwrapping at the Axios level breaks `AxiosResponse`
// typing (callers would receive `any`). To keep the scaffold type-safe under
// strict mode, services read `.data` themselves.
//
// Error: on 401/403, sign the user out (Requirements 10.3–10.5). If signOut
// throws or no bridge is registered, fall back to clearing local auth state and
// redirecting to /login. Always reject with a normalized `ApiError`.
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (status === 401 || status === 403) {
      try {
        await authSignOut();
      } catch {
        clearLocalAuthAndRedirect();
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

/**
 * Best-effort fallback when {@link authSignOut} is unavailable or throws:
 * clear known local auth keys and force a redirect to the login page. Guarded
 * for non-browser (SSR/test) environments.
 */
function clearLocalAuthAndRedirect(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors (e.g. disabled/again unavailable).
  }
  window.location.assign("/login");
}

export { httpClient };
export default httpClient;
