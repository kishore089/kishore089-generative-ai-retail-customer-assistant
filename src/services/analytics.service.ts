/**
 * Analytics service — calls the live API Gateway endpoint `GET /analytics`.
 *
 * Fetches the admin analytics report and maps it defensively. The live API
 * returns the analytics object at the top level (not wrapped in a `data`
 * envelope), but this parser tolerates both shapes. No mock data: numbers
 * default to 0 and lists default to `[]`, which faithfully reflects the real
 * "no records yet" state of the backend.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

export interface AnalyticsSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
}

export interface AnalyticsResolution {
  resolvedRequests: number;
  unresolvedRequests: number;
  resolutionRate: number;
}

export interface AnalyticsEscalation {
  escalatedRequests: number;
  notEscalatedRequests: number;
  escalationRate: number;
}

export interface AnalyticsSentiment {
  positive: number;
  neutral: number;
  negative: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
}

export interface AnalyticsIntent {
  name?: string;
  count?: number;
}

export interface AnalyticsConversationStats {
  completedSessions: number;
  totalSessionDurationSeconds: number;
  averageHandleTimeSeconds: number;
  averageHandleTimeMinutes: number;
}

export interface AnalyticsConversation {
  analyticsId?: string;
  customerId?: string;
  sessionId?: string;
  message?: string;
  intent?: string;
  success?: boolean;
  resolved?: boolean;
  escalated?: boolean;
  sentiment?: string;
  responseTimeMs?: number;
  channel?: string;
  timestamp?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  generatedAt?: string;
  summary: AnalyticsSummary;
  conversation: AnalyticsConversationStats;
  resolution: AnalyticsResolution;
  escalation: AnalyticsEscalation;
  sentiment: AnalyticsSentiment;
  intents: AnalyticsIntent[];
  recentConversations: AnalyticsConversation[];
}

/** True when `value` is a non-null, non-array plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerces a value to a finite number, mapping absent/NaN inputs to 0. */
function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

/** Returns `value` when it is a string, otherwise `undefined`. */
function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Returns `value` when it is a finite number, otherwise `undefined`. */
function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/** Returns `value` when it is a boolean, otherwise `undefined`. */
function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Decides whether `value` looks like the analytics object. We consider it a
 * match when it is a record carrying any of the analytics-shaped keys.
 */
function looksLikeAnalytics(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }
  return (
    "summary" in value ||
    "conversation" in value ||
    "resolution" in value ||
    "escalation" in value ||
    "sentiment" in value ||
    "intents" in value ||
    "recentConversations" in value
  );
}

function parseSummary(value: unknown): AnalyticsSummary {
  const rec = isRecord(value) ? value : {};
  return {
    totalRequests: toNumber(rec.totalRequests),
    successfulRequests: toNumber(rec.successfulRequests),
    failedRequests: toNumber(rec.failedRequests),
    averageResponseTimeMs: toNumber(rec.averageResponseTimeMs),
  };
}

function parseConversationStats(value: unknown): AnalyticsConversationStats {
  const rec = isRecord(value) ? value : {};
  return {
    completedSessions: toNumber(rec.completedSessions),
    totalSessionDurationSeconds: toNumber(rec.totalSessionDurationSeconds),
    averageHandleTimeSeconds: toNumber(rec.averageHandleTimeSeconds),
    averageHandleTimeMinutes: toNumber(rec.averageHandleTimeMinutes),
  };
}

function parseResolution(value: unknown): AnalyticsResolution {
  const rec = isRecord(value) ? value : {};
  return {
    resolvedRequests: toNumber(rec.resolvedRequests),
    unresolvedRequests: toNumber(rec.unresolvedRequests),
    resolutionRate: toNumber(rec.resolutionRate),
  };
}

function parseEscalation(value: unknown): AnalyticsEscalation {
  const rec = isRecord(value) ? value : {};
  return {
    escalatedRequests: toNumber(rec.escalatedRequests),
    notEscalatedRequests: toNumber(rec.notEscalatedRequests),
    escalationRate: toNumber(rec.escalationRate),
  };
}

function parseSentiment(value: unknown): AnalyticsSentiment {
  const rec = isRecord(value) ? value : {};
  return {
    positive: toNumber(rec.positive),
    neutral: toNumber(rec.neutral),
    negative: toNumber(rec.negative),
    positivePercentage: toNumber(rec.positivePercentage),
    neutralPercentage: toNumber(rec.neutralPercentage),
    negativePercentage: toNumber(rec.negativePercentage),
  };
}

function parseIntents(value: unknown): AnalyticsIntent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map((rec) => ({
    name: optionalString(rec.name) ?? optionalString(rec.intent),
    count: optionalNumber(rec.count),
  }));
}

function parseConversations(value: unknown): AnalyticsConversation[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map((rec) => ({
    analyticsId: optionalString(rec.analyticsId),
    customerId: optionalString(rec.customerId),
    sessionId: optionalString(rec.sessionId),
    message: optionalString(rec.message),
    intent: optionalString(rec.intent),
    success: optionalBoolean(rec.success),
    resolved: optionalBoolean(rec.resolved),
    escalated: optionalBoolean(rec.escalated),
    sentiment: optionalString(rec.sentiment),
    responseTimeMs: optionalNumber(rec.responseTimeMs),
    channel: optionalString(rec.channel),
    timestamp: optionalString(rec.timestamp),
  }));
}

/**
 * Retrieves the analytics report from the live backend.
 *
 * @throws ApiError - Normalized error on request failure.
 */
export async function getAnalytics(): Promise<AnalyticsResponse> {
  try {
    const res = await api.get("/analytics");
    const payload: unknown = res.data;

    let source: Record<string, unknown>;
    if (looksLikeAnalytics(payload)) {
      source = payload;
    } else if (
      isRecord(payload) &&
      looksLikeAnalytics((payload as { data?: unknown }).data)
    ) {
      source = (payload as { data: Record<string, unknown> }).data;
    } else {
      source = isRecord(payload) ? payload : {};
    }

    return {
      success: typeof source.success === "boolean" ? source.success : false,
      generatedAt: optionalString(source.generatedAt),
      summary: parseSummary(source.summary),
      conversation: parseConversationStats(source.conversation),
      resolution: parseResolution(source.resolution),
      escalation: parseEscalation(source.escalation),
      sentiment: parseSentiment(source.sentiment),
      intents: parseIntents(source.intents),
      recentConversations: parseConversations(source.recentConversations),
    };
  } catch (err) {
    throw normalizeError(err);
  }
}
