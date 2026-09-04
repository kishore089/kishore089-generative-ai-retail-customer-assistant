import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** A single breadcrumb entry. When `to` is provided the label links to that route. */
export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  /** Primary page title, rendered as an `<h1>`. */
  title: string;
  /** Optional supporting description shown beneath the title. */
  description?: string;
  /** Optional right-aligned action slot (e.g. buttons). */
  actions?: ReactNode;
  /** Optional breadcrumb trail rendered above the title. */
  breadcrumbs?: Breadcrumb[];
}

/**
 * Standardized page title block: an optional breadcrumb row followed by a
 * responsive flex row containing the title/description on the left and an
 * optional right-aligned `actions` slot.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "font-medium text-neutral-700 dark:text-neutral-200"
                          : undefined
                      }
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast ? (
                    <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
                      /
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default PageHeader;
