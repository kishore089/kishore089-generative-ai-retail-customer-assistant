import type { ReactNode } from "react";

export interface InfoCardProps {
  /** Card heading. */
  title: string;
  /** Optional supporting text rendered beneath the title. */
  description?: string;
  /** Optional icon rendered to the left of the title. */
  icon?: ReactNode;
  /** Optional footer content rendered below the body, separated by a divider. */
  footer?: ReactNode;
  /** Optional body content. */
  children?: ReactNode;
}

const surfaceClasses =
  "rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800";

/**
 * A general-purpose informational card with an optional icon, title,
 * description, body content, and footer.
 */
export function InfoCard({ title, description, icon, footer, children }: InfoCardProps) {
  return (
    <div className={surfaceClasses}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 text-neutral-400 dark:text-neutral-500" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          ) : null}
        </div>
      </div>

      {children ? (
        <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-300">{children}</div>
      ) : null}

      {footer ? (
        <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">{footer}</div>
      ) : null}
    </div>
  );
}
