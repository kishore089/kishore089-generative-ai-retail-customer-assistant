export interface LoadingProps {
  /** Optional text shown beneath the spinner. */
  label?: string;
  /** When true, centers the spinner within a full-viewport container. */
  fullscreen?: boolean;
  /** Spinner size. Defaults to `"md"`. */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<LoadingProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

/**
 * Centered loading indicator. Renders an accessible animated spinner with an
 * optional label. When `fullscreen` is set the indicator is centered within a
 * `min-h-screen` container; otherwise it fills the available area.
 */
export function Loading({
  label,
  fullscreen = false,
  size = "md",
}: LoadingProps) {
  const containerClasses = fullscreen
    ? "flex min-h-screen w-full flex-col items-center justify-center gap-3"
    : "flex w-full flex-col items-center justify-center gap-3 py-10";

  return (
    <div className={containerClasses} role="status" aria-live="polite" aria-busy="true">
      <span
        className={`inline-block animate-spin rounded-full border-neutral-200 border-t-primary-500 dark:border-neutral-700 dark:border-t-primary-400 ${SIZE_CLASSES[size]}`}
      />
      {label ? (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      ) : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

export default Loading;
