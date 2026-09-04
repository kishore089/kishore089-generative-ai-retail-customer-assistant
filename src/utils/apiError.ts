import type { ApiError } from "@/types/api";

/**
 * Produces a user-friendly message for an arbitrary thrown value.
 *
 * When the value looks like an {@link ApiError} (an object with a numeric
 * `status`), maps common failure classes to friendly copy; otherwise falls
 * back to a generic message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    const apiError = error as ApiError;
    if (apiError.status === 0) {
      return "Network error — please check your connection and try again.";
    }
    if (apiError.status >= 500) {
      return "The server encountered an error. Please try again in a moment.";
    }
    return apiError.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
