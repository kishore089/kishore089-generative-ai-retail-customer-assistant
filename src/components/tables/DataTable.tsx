import type { ReactNode } from "react";

import { EmptyState } from "@/components/common";

import { TableSkeleton } from "./TableSkeleton";

/** Horizontal alignment options for a table column. */
export type ColumnAlign = "start" | "center" | "end";

export interface Column<T> {
  /** Property key on the row, or an arbitrary identifier when using `render`. */
  key: keyof T | string;
  /** Column header label. */
  header: string;
  /** Optional custom cell renderer; falls back to the raw string value. */
  render?: (row: T) => ReactNode;
  /** Optional horizontal alignment for the header and cells. Defaults to "start". */
  align?: ColumnAlign;
}

export interface DataTableProps<T> {
  /** Column definitions describing headers and cell rendering. */
  columns: Column<T>[];
  /** Row data to render. */
  rows: T[];
  /** When true, renders a {@link TableSkeleton} instead of rows. */
  loading?: boolean;
  /** Message shown via {@link EmptyState} when there are no rows. */
  emptyMessage?: string;
  /** Returns a stable unique id for a row (used as React key). */
  getRowId: (row: T) => string;
}

const ALIGN_CLASS: Record<ColumnAlign, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

function alignClass(align?: ColumnAlign): string {
  return ALIGN_CLASS[align ?? "start"];
}

/**
 * Generic, typed data table built on a semantic HTML `<table>` styled with
 * Tailwind theme tokens. Handles three states:
 * - `loading`: renders a {@link TableSkeleton}.
 * - empty rows: renders an {@link EmptyState}.
 * - populated: renders a styled table with per-column alignment and optional
 *   custom cell renderers.
 */
export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyMessage,
  getRowId,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyMessage ?? "No data"} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 ${alignClass(
                  column.align,
                )}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              className="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-4 py-3 text-neutral-900 dark:text-neutral-100 ${alignClass(
                    column.align,
                  )}`}
                >
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key as string] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
