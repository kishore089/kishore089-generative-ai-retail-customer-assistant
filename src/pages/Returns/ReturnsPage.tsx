import { Alert } from "@heroui/react";

import { Loading, PageHeader, StatusBadge } from "@/components/common";
import { DataTable } from "@/components/tables";
import type { Column } from "@/components/tables";
import { useReturns } from "@/hooks";
import type { ReturnRecord } from "@/services";
import { getApiErrorMessage } from "@/utils/apiError";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const returnColumns: Column<ReturnRecord>[] = [
  { key: "ReturnID", header: "Return ID" },
  { key: "OrderID", header: "Order ID" },
  {
    key: "Status",
    header: "Status",
    render: (record) => <StatusBadge value={record.Status} />,
  },
  { key: "Reason", header: "Reason" },
  {
    key: "RefundAmount",
    header: "Refund Amount",
    align: "end",
    render: (record) =>
      typeof record.RefundAmount === "number" ? formatCurrency(record.RefundAmount) : "—",
  },
  {
    key: "CreatedDate",
    header: "Created",
    render: (record) => formatDate(record.CreatedDate),
  },
];

/**
 * Protected Returns page — lists the active customer's returns from the live
 * API via {@link useReturns}, with shared loading / error / empty states.
 */
export function ReturnsPage() {
  const { data, isLoading, isError, error } = useReturns();

  return (
    <div>
      <PageHeader
        title="Returns"
        description="Review the status of your return and refund requests."
      />

      {isLoading ? (
        <Loading label="Loading returns…" />
      ) : isError ? (
        <Alert status="danger">
          <Alert.Title>Couldn&apos;t load returns</Alert.Title>
          <Alert.Description>{getApiErrorMessage(error)}</Alert.Description>
        </Alert>
      ) : (data ?? []).length === 0 ? (
        <Alert status="default">
          <Alert.Title>No returns found</Alert.Title>
          <Alert.Description>There are no return requests for this customer yet.</Alert.Description>
        </Alert>
      ) : (
        <DataTable
          columns={returnColumns}
          rows={data ?? []}
          getRowId={(record) => record.ReturnID}
        />
      )}
    </div>
  );
}

export default ReturnsPage;
