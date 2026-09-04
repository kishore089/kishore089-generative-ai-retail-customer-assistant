export interface TableSkeletonProps {
  /** Number of columns to render placeholder cells for. */
  columns: number;
  /** Number of placeholder rows to render. Defaults to 5. */
  rows?: number;
}

/**
 * Animated loading placeholder for {@link DataTable}. Renders a grid of
 * pulsing neutral blocks matching the requested column/row counts while data
 * is being fetched.
 */
export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  const columnCount = Math.max(columns, 1);
  const rowCount = Math.max(rows, 1);
  const columnKeys = Array.from({ length: columnCount }, (_, index) => index);
  const rowKeys = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
      aria-hidden="true"
    >
      <div className="animate-pulse">
        {/* Header placeholder */}
        <div className="flex gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
          {columnKeys.map((columnKey) => (
            <div
              key={`header-${columnKey}`}
              className="h-3 flex-1 rounded bg-neutral-200 dark:bg-neutral-700"
            />
          ))}
        </div>
        {/* Body placeholders */}
        {rowKeys.map((rowKey) => (
          <div
            key={`row-${rowKey}`}
            className="flex gap-4 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-700"
          >
            {columnKeys.map((columnKey) => (
              <div
                key={`cell-${rowKey}-${columnKey}`}
                className="h-3 flex-1 rounded bg-neutral-200 dark:bg-neutral-700"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;
