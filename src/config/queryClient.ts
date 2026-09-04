import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client (singleton).
 *
 * Per design (Data Layer / Requirement 9.2), the default caching, retry, and
 * stale-time settings for server state live here in this single configuration
 * module so every query and mutation behaves consistently across the app.
 *
 * Defaults explained:
 * - queries.staleTime (60s): fetched data is considered fresh for one minute,
 *   avoiding redundant background refetches while navigating between views.
 * - queries.gcTime (5m): inactive/unused cache entries are garbage-collected
 *   after five minutes, freeing memory once no component observes them.
 * - queries.retry (1): a failed query is retried once before surfacing an error,
 *   smoothing over transient network blips without masking real failures.
 * - queries.refetchOnWindowFocus (false): avoids surprise refetches when the
 *   user tabs back to the window; navigation/explicit invalidation drives reloads.
 * - mutations.retry (0): mutations are not retried automatically to prevent
 *   accidental duplicate side effects.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 5 * 60_000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
