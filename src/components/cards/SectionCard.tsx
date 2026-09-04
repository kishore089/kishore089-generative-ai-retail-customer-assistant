import type { ReactNode } from "react";

export interface SectionCardProps {
  /** Section heading shown in the card header row. */
  title: string;
  /** Optional footer content rendered below the body, separated by a divider. */
  footer?: ReactNode;
  /** Section body content. */
  children: ReactNode;
}

const surfaceClasses =
  "rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800";

/**
 * A titled section container: a header row with the section title, a body
 * region for arbitrary content, and an optional footer.
 */
export function SectionCard({ title, footer, children }: SectionCardProps) {
  return (
    <section className={surfaceClasses}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
      </div>

      <div className="px-5 py-4">{children}</div>

      {footer ? (
        <div className="border-t border-neutral-200 px-5 py-3 dark:border-neutral-700">{footer}</div>
      ) : null}
    </section>
  );
}
