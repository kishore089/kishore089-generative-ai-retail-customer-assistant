/**
 * RHF-ready contract — presentational only.
 *
 * React Hook Form integration is deferred to a later iteration. `FormSection`
 * is a presentational grouping wrapper for related fields; it will sit inside a
 * react-hook-form `<form>` once wiring is added. No react-hook-form wiring
 * exists here yet.
 */
import type { ReactNode } from "react";

export interface FormSectionProps {
  /** Optional section title rendered as a heading above the grouped fields. */
  title?: string;
  /** Optional supporting description shown beneath the title. */
  description?: string;
  /** The grouped form fields (typically `FormField` elements). */
  children: ReactNode;
}

/**
 * Groups related form fields with an optional title and description. Renders an
 * optional header block followed by a vertically stacked group of children.
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      {title || description ? (
        <div className="flex flex-col gap-1">
          {title ? (
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default FormSection;
