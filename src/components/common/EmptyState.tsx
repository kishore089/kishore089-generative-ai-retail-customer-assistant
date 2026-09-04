import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Primary message describing the empty condition. */
  title: string;
  /** Optional supporting text with more detail or guidance. */
  description?: string;
  /** Optional decorative icon rendered above the title. */
  icon?: ReactNode;
  /** Optional call-to-action slot (e.g. a button or link). */
  action?: ReactNode;
}

/**
 * Centered placeholder shown when a list, page, or panel has no content.
 * Renders an optional icon, a title, an optional description and an optional
 * action slot.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon ? (
        <div className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
        {description ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
