/**
 * Amazon Lex chat integration for the AI Assistant page.
 *
 * POSTs conversational turns to the real API Gateway `/lex` route using the
 * shared {@link api} Axios instance. The endpoint is resolved from
 * `VITE_LEX_API_URL`: an absolute URL is used as-is (Axios ignores `baseURL`
 * for absolute URLs), while the fallback resolves against the configured API
 * base URL. There are NO mock responses here and NO embedded AWS credentials —
 * every call hits the live backend.
 *
 * Structured as a single exported request function so additional channels
 * (e.g. voice) can be layered on later without reshaping callers. No
 * voice/audio behavior is implemented in this module.
 */

import axios from "axios";

import { api } from "@/services/api";

/** Request body sent to the Lex `/lex` route for a text chat turn. */
export interface LexChatRequest {
  action: "chat";
  message: string;
  customerId: string;
  sessionId: string;
  channel: "web";
}

/** A single assistant message returned by Lex. */
export interface LexMessage {
  content: string;
  contentType: string;
}

/** Response shape returned by the `/lex` route. */
export interface LexChatResponse {
  success: boolean;
  requestId?: string;
  customerId?: string;
  sessionId?: string;
  source?: string;
  intent?: string;
  message?: string;
  messages?: LexMessage[];
  sessionState?: unknown;
  executionTimeMs?: number;
}

/** Typed, user-friendly service error surfaced to the UI. */
export interface LexServiceError {
  status: number;
  /** User-friendly message; never exposes AWS internals. */
  message: string;
}

/**
 * Endpoint for the Lex chat route. An absolute URL from `VITE_LEX_API_URL`
 * overrides the Axios `baseURL`; the fallback resolves against the shared API
 * base URL.
 */
const LEX_URL =
  import.meta.env.VITE_LEX_API_URL ??
  `${import.meta.env.VITE_API_BASE_URL ?? ""}/lex`;

/** Map an HTTP status (0 = no response) to a user-friendly message. */
function lexErrorMessage(status: number): string {
  if (status === 0) {
    return "Unable to connect to the AI service. Please try again.";
  }
  if (status === 400) {
    return "The AI service couldn't understand that request.";
  }
  if (status === 401 || status === 403) {
    return "You're not authorized to use the AI service.";
  }
  if (status === 404) {
    return "AI service endpoint was not found.";
  }
  if (status >= 500) {
    return "AI service is temporarily unavailable.";
  }
  return "Sorry, something went wrong with the AI service. Please try again.";
}

/**
 * Send a chat message to the Lex backend and return its response.
 *
 * On failure, always logs the real error in dev and throws a typed
 * {@link LexServiceError} carrying a user-friendly message.
 */
export async function sendLexMessage(args: {
  message: string;
  customerId: string;
  sessionId: string;
}): Promise<LexChatResponse> {
  const body: LexChatRequest = {
    action: "chat",
    message: args.message,
    customerId: args.customerId,
    sessionId: args.sessionId,
    channel: "web",
  };

  try {
    const res = await api.post<LexChatResponse>(LEX_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    return res.data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 0) : 0;
    if (import.meta.env.DEV) {
      console.error("[lex.service] request failed:", {
        url: LEX_URL,
        status,
        data: axios.isAxiosError(err) ? err.response?.data : undefined,
        error: err,
      });
    }
    const serviceError: LexServiceError = {
      status,
      message: lexErrorMessage(status),
    };
    throw serviceError;
  }
}

/**
 * Extract the assistant's displayable text(s) from a Lex response.
 *
 * Prefers `messages`: uses `PlainText` items when present, otherwise all
 * items' `content`. Falls back to `message`. Returns non-empty trimmed
 * strings only, and never raw JSON.
 */
export function extractAssistantTexts(res: LexChatResponse): string[] {
  if (Array.isArray(res.messages) && res.messages.length > 0) {
    const plainText = res.messages.filter((m) => m.contentType === "PlainText");
    const source = plainText.length > 0 ? plainText : res.messages;
    return source
      .map((m) => m.content)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
  }

  if (typeof res.message === "string" && res.message.trim() !== "") {
    return [res.message];
  }

  return [];
}

/** Generate a UUID, falling back when `crypto.randomUUID` is unavailable. */
function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Return a stable Lex session id for the given customer.
 *
 * Persists per-customer under `ai-session-<customerId>` in `sessionStorage`
 * so the whole conversation shares one session. A different `customerId`
 * yields a different key (and therefore a fresh session on customer change).
 * If storage is unavailable, a freshly generated id is returned.
 */
export function getLexSessionId(customerId: string): string {
  const key = `ai-session-${customerId}`;

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing !== null && existing !== "") {
        return existing;
      }
      const created = `${customerId}-${generateUuid()}`;
      window.sessionStorage.setItem(key, created);
      return created;
    } catch {
      return `${customerId}-${generateUuid()}`;
    }
  }

  return `${customerId}-${generateUuid()}`;
}

/**
 * Return a stable conversation start timestamp (ISO 8601) for the given
 * customer.
 *
 * Mirrors {@link getLexSessionId}: persists per-customer under
 * `ai-conversation-start-<customerId>` in `sessionStorage` so the whole
 * conversation shares one start marker. A stored value is returned as-is;
 * otherwise a fresh `new Date().toISOString()` is stored and returned. If
 * storage is unavailable, a freshly generated timestamp is returned.
 */
export function getConversationStartTime(customerId: string): string {
  const key = `ai-conversation-start-${customerId}`;

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing !== null && existing !== "") {
        return existing;
      }
      const created = new Date().toISOString();
      window.sessionStorage.setItem(key, created);
      return created;
    } catch {
      return new Date().toISOString();
    }
  }

  return new Date().toISOString();
}
