import { Alert } from "@heroui/react";

import { Loading, PageHeader, StatusBadge } from "@/components/common";
import { DataTable } from "@/components/tables";
import type { Column } from "@/components/tables";
import { useOrders } from "@/hooks";
import type { Order } from "@/services";
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

const orderColumns: Column<Order>[] = [
  { key: "OrderID", header: "Order ID" },
  { key: "ProductName", header: "Product Name" },
  {
    key: "Status",
    header: "Status",
    render: (order) => <StatusBadge value={order.Status} />,
  },
  { key: "OrderDate", header: "Order Date", render: (order) => formatDate(order.OrderDate) },
  {
    key: "ExpectedDelivery",
    header: "Expected Delivery",
    render: (order) => (order.ExpectedDelivery ? formatDate(order.ExpectedDelivery) : "—"),
  },
  { key: "TrackingID", header: "Tracking ID", render: (order) => order.TrackingID ?? "—" },
  { key: "Courier", header: "Courier", render: (order) => order.Courier ?? "—" },
  {
    key: "OrderAmount",
    header: "Amount",
    align: "end",
    render: (order) =>
      typeof order.OrderAmount === "number" ? formatCurrency(order.OrderAmount) : "—",
  },
  {
    key: "CancelEligibility",
    header: "Cancel Eligible",
    render: (order) =>
      order.CancelEligibility === true
        ? "Yes"
        : order.CancelEligibility === false
          ? "No"
          : "—",
  },
];

/**
 * Protected Orders page — lists the active customer's orders from the live API
 * via {@link useOrders}, with shared loading / error / empty states.
 */
export function OrdersPage() {
  const { data, isLoading, isError, error } = useOrders();

  return (
    <div>
      <PageHeader title="Orders" description="Track and review your recent purchases." />

      {isLoading ? (
        <Loading label="Loading orders…" />
      ) : isError ? (
        <Alert status="danger">
          <Alert.Title>Couldn&apos;t load orders</Alert.Title>
          <Alert.Description>{getApiErrorMessage(error)}</Alert.Description>
        </Alert>
      ) : (data ?? []).length === 0 ? (
        <Alert status="default">
          <Alert.Title>No orders found</Alert.Title>
          <Alert.Description>There are no orders for this customer yet.</Alert.Description>
        </Alert>
      ) : (
        <DataTable
          columns={orderColumns}
          rows={data ?? []}
          getRowId={(order) => order.OrderID}
        />
      )}
    </div>
  );
}

export default OrdersPage;
