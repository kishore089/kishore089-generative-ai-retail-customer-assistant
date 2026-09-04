/**
 * Conversation lifecycle integration for the AI Assistant page.
 *
 * POSTs to the real API Gateway `/conversation/end` and
 * `/conversation/acw-complete` routes using the shared {@link api} Axios
 * instance. There are NO mock responses here and NO embedded credentials —
 * every call hits the live backend. Responses are parsed defensively so a
 * payload delivered either at the top level or nested under `data` is handled,
 * and durations are left `undefined` when absent (never faked to `0`).
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

/** Request body for ending a conversation. */
export interface EndConversationRequest {
  customerId: string;
  sessionId: string;
  conversationStartTime: string;
}

/** Response returned by the `/conversation/end` route. */
export interface EndConversationResponse {
  success: boolean;
  analyticsId?: string;
  conversationEndTime?: string;
  acwStartTime?: string;
  acwStatus?: string;
}

/** Request body for completing After-Call Work (ACW). */
export interface AcwCompleteRequest {
  analyticsId: string;
}

/** Response returned by the `/conversation/acw-complete` route. */
export interface AcwCompleteResponse {
  success: boolean;
  analyticsId?: string;
  acwStartTime?: string;
  acwEndTime?: string;
  acwDurationSeconds?: number;
  acwDurationMinutes?: number;
  acwStatus?: string;
}

/** Narrow an unknown value to a plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Return `value` when it is a string, otherwise `undefined`. */
function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Return `value` when it is a finite number, otherwise `undefined`. */
function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Return `value` when it is a boolean, otherwise `undefined`. */
function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Resolve the payload object from a raw Axios `res.data`, accepting either the
 * object at the top level or nested under a `data` key.
 */
function resolvePayload(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) {
    return {};
  }
  const nested = raw.data;
  if (isRecord(nested)) {
    return nested;
  }
  return raw;
}

/**
 * End the active conversation. Returns the analytics id and ACW start marker
 * used to drive the post-conversation UI. On failure, throws a normalized
 * {@link import("@/types/api").ApiError}.
 */
export async function endConversation(
  req: EndConversationRequest,
): Promise<EndConversationResponse> {
  try {
    const res = await api.post("/conversation/end", req, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    const payload = resolvePayload(res.data);
    return {
      success: optionalBoolean(payload.success) ?? false,
      analyticsId: optionalString(payload.analyticsId),
      conversationEndTime: optionalString(payload.conversationEndTime),
      acwStartTime: optionalString(payload.acwStartTime),
      acwStatus: optionalString(payload.acwStatus),
    };
  } catch (err) {
    throw normalizeError(err);
  }
}

/**
 * Complete After-Call Work for a conversation. Returns the authoritative,
 * backend-computed ACW durations. Durations are left `undefined` when the
 * backend omits them so the UI never displays a fabricated `0`. On failure,
 * throws a normalized {@link import("@/types/api").ApiError}.
 */
export async function completeAcw(
  req: AcwCompleteRequest,
): Promise<AcwCompleteResponse> {
  try {
    const res = await api.post("/conversation/acw-complete", req, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    const payload = resolvePayload(res.data);
    return {
      success: optionalBoolean(payload.success) ?? false,
      analyticsId: optionalString(payload.analyticsId),
      acwStartTime: optionalString(payload.acwStartTime),
      acwEndTime: optionalString(payload.acwEndTime),
      acwDurationSeconds: optionalNumber(payload.acwDurationSeconds),
      acwDurationMinutes: optionalNumber(payload.acwDurationMinutes),
      acwStatus: optionalString(payload.acwStatus),
    };
  } catch (err) {
    throw normalizeError(err);
  }
}
