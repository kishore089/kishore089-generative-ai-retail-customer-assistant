import { Link } from "react-router-dom";

import { PATHS } from "@/routes/paths";

/**
 * 404 Not Found page (Requirement 16.3).
 *
 * Renders when no route matches the current URL. Provides a clear message and
 * a link back to the stable dashboard route so the user can recover from a
 * broken or unknown location.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 text-center">
      <p className="text-7xl font-bold tracking-tight text-primary-600 sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        to={PATHS.dashboard}
        className="mt-8 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
