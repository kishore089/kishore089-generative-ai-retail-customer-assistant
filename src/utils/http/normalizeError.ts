import axios from "axios";

import type { ApiError } from "@/types/api";

/**
 * Normalizes any thrown value into a stable {@link ApiError}.
 *
 * Total and pure: for ANY input it returns an `ApiError` whose `status` is a
 * number (0 when there is no HTTP response) and whose `message` is a non-empty
 * string. It never throws. (Design: Error normalization totality — Property 6.)
 */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    if (response) {
      // Axios error WITH an HTTP response from the server.
      const data: unknown = response.data;
      const serverMessage =
        typeof data === "object" &&
        data !== null &&
        typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : undefined;

      return {
        status: response.status,
        message: ensureMessage(serverMessage ?? error.message, "Request failed"),
        code: error.code,
        details: data,
      };
    }

    // Axios error WITHOUT a response (network error / timeout / cancellation).
    return {
      status: 0,
      message: ensureMessage(error.message, "Network error"),
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: ensureMessage(error.message, "Unexpected error"),
    };
  }

  if (typeof error === "string" && error) {
    return {
      status: 0,
      message: error,
    };
  }

  return {
    status: 0,
    message: "Unknown error",
  };
}

/** Returns `value` when it is a non-empty string, otherwise `fallback`. */
function ensureMessage(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
