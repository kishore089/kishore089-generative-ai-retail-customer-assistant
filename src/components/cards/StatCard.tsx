import type { ReactNode } from "react";

/** Directional trend indicator for a {@link StatCard}. */
export interface StatCardDelta {
  /** Numeric magnitude of the change (rendered as a percentage/absolute value). */
  value: number;
  /** Whether the trend points up (positive) or down (negative). */
  direction: "up" | "down";
}

export interface StatCardProps {
  /** Muted descriptor for the metric (e.g. "Total Orders"). */
  label: string;
  /** The primary KPI value shown prominently. */
  value: string | number;
  /** Optional trend indicator rendered beneath the value. */
  delta?: StatCardDelta;
  /** Optional icon rendered in the top-right corner. */
  icon?: ReactNode;
  /** When true, render a placeholder skeleton instead of content. */
  loading?: boolean;
}

const surfaceClasses =
  "rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800";

/**
 * A compact KPI card showing a labelled metric, its value, an optional
 * directional delta, and an optional icon. Renders an animated placeholder
 * while {@link StatCardProps.loading} is true.
 */
export function StatCard({ label, value, delta, icon, loading = false }: StatCardProps) {
  if (loading) {
    return (
      <div className={surfaceClasses} aria-busy="true">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-8 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  const isUp = delta?.direction === "up";

  return (
    <div className={surfaceClasses}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        {icon ? (
          <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{value}</p>

      {delta ? (
        <p
          className={
            "mt-2 inline-flex items-center gap-1 text-sm font-medium " +
            (isUp
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400")
          }
        >
          <span aria-hidden="true">{isUp ? "\u2191" : "\u2193"}</span>
          {Math.abs(delta.value)}%
        </p>
      ) : null}
    </div>
  );
}
