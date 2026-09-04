import { Alert } from "@heroui/react";

import { Loading, PageHeader, StatusBadge } from "@/components/common";
import { DataTable } from "@/components/tables";
import type { Column } from "@/components/tables";
import { usePayments } from "@/hooks";
import type { Payment } from "@/services";
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

const paymentColumns: Column<Payment>[] = [
  { key: "PaymentID", header: "Payment ID" },
  { key: "OrderID", header: "Order ID" },
  {
    key: "Amount",
    header: "Amount",
    align: "end",
    render: (payment) => formatCurrency(payment.Amount),
  },
  {
    key: "Status",
    header: "Status",
    render: (payment) => <StatusBadge value={payment.Status} />,
  },
  { key: "Method", header: "Method" },
  { key: "Date", header: "Date", render: (payment) => formatDate(payment.Date) },
];

/**
 * Protected Payments page — lists the active customer's payments from the live
 * API via {@link usePayments}, with shared loading / error / empty states.
 */
export function PaymentsPage() {
  const { data, isLoading, isError, error } = usePayments();

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Review your payment and transaction history."
      />

      {isLoading ? (
        <Loading label="Loading payments…" />
      ) : isError ? (
        <Alert status="danger">
          <Alert.Title>Couldn&apos;t load payments</Alert.Title>
          <Alert.Description>{getApiErrorMessage(error)}</Alert.Description>
        </Alert>
      ) : (data ?? []).length === 0 ? (
        <Alert status="default">
          <Alert.Title>No payments found</Alert.Title>
          <Alert.Description>There are no payments for this customer yet.</Alert.Description>
        </Alert>
      ) : (
        <DataTable
          columns={paymentColumns}
          rows={data ?? []}
          getRowId={(payment) => payment.PaymentID}
        />
      )}
    </div>
  );
}

export default PaymentsPage;
