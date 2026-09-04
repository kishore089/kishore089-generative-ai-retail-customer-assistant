import { useEffect, useRef } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  loadingLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small, reusable, accessible confirmation dialog.
 *
 * Renders a centered card over a dimmed backdrop with a title, optional
 * description, optional error line, and cancel/confirm actions. Escape cancels
 * (unless loading), focus moves to the dialog on open and is restored on close,
 * and the destructive variant styles the confirm action red. Renders nothing
 * when closed. No button is focused by default, so pressing Enter cannot
 * accidentally trigger the destructive action.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  loadingLabel,
  destructive = false,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);

  useEffect(() => {
    onCancelRef.current = onCancel;
    loadingRef.current = loading;
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingRef.current) {
        onCancelRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={() => {
          if (!loading) {
            onCancel();
          }
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-5 shadow-xl outline-none dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="confirm-dialog-description"
            className="mt-2 text-sm text-neutral-600 dark:text-neutral-300"
          >
            {description}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
              (destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700")
            }
          >
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
