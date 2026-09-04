/**
 * RHF-ready contract — presentational only.
 *
 * React Hook Form integration is deferred to a later iteration. This component
 * is a presentational field wrapper meant to be connected to react-hook-form's
 * `Controller`/`register` later (the `error` prop will receive
 * `formState.errors[name]?.message`, the control slotted via `children`).
 * No react-hook-form wiring exists here yet.
 */
import type { ReactNode } from "react";

export interface FormFieldProps {
  /** Field name — becomes the control's `id`/`htmlFor` association. */
  name: string;
  /** Human-readable field label. */
  label: string;
  /** Field-level validation message. When present, rendered in danger styling (Req 13.3). */
  error?: string;
  /** Marks the field as required, rendering a red asterisk next to the label. */
  required?: boolean;
  /** Optional muted helper text shown beneath the label. */
  hint?: string;
  /** The form control (Input, Select, etc.) rendered in the field slot. */
  children: ReactNode;
}

/**
 * Labeled field wrapper: renders a `<label>` associated with the control via
 * `name`, an optional required asterisk, the control (`children`) slot, an
 * optional muted hint, and a field-level error message when `error` is set.
 */
export function FormField({
  name,
  label,
  error,
  required,
  hint,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="text-xs text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      ) : null}

      <div>{children}</div>

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
