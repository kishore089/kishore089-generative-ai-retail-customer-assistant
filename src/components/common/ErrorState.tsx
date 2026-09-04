import { Link } from "react-router-dom";

export interface ErrorStateProps {
  /** Heading for the error panel. Defaults to `"Something went wrong"`. */
  title?: string;
  /** Human-readable description of what failed. */
  message: string;
  /** Optional retry handler. When provided a "Try again" button is shown. */
  onRetry?: () => void;
  /** Stable route to return to. Defaults to `"/dashboard"`. */
  homeHref?: string;
}

/**
 * Error panel used both as the `ErrorBoundary` fallback and as an inline page
 * error control. Displays a title, a message, an optional retry action and a
 * link back to a stable route.
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  homeHref = "/dashboard",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">{title}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Try again
          </button>
        ) : null}
        <Link
          to={homeHref}
          className="rounded-md px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Return to safety
        </Link>
      </div>
    </div>
  );
}

export default ErrorState;
