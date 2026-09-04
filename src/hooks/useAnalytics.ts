/**
 * React Query hook for the admin analytics report (`GET /analytics`).
 *
 * Keyed by a static `["analytics"]` cache key since the report is global (not
 * per-customer). Returns real backend values; zeros / empty arrays reflect the
 * genuine "no records yet" state.
 */

import { useQuery } from "@tanstack/react-query";

import { getAnalytics, type AnalyticsResponse } from "@/services/analytics.service";
import type { ApiError } from "@/types/api";

export function useAnalytics() {
  return useQuery<AnalyticsResponse, ApiError>({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  });
}
