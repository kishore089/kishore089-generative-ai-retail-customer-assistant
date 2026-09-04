import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "@heroui/react";

import { SectionCard } from "@/components/cards";
import { PageHeader, StatusBadge } from "@/components/common";
import {
  ORDER_STATUSES,
  updateOrderStatus,
} from "@/services/orderManagement.service";
import type {
  AdminOrder,
  OrderStatus,
  UpdateOrderStatusResponse,
} from "@/services/orderManagement.service";
import { getApiErrorMessage } from "@/utils/apiError";
import type { ApiError } from "@/types/api";

const inputClasses =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500";

const labelClasses =
  "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200";

const primaryButtonClasses =
  "inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700";

/** Renders a string value or an em dash placeholder when empty. */
function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value;
}

/** Formats an optional numeric amount (no currency symbol assumed). */
function formatAmount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/** Formats an optional quantity for display. */
function formatQuantity(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return String(value);
}

interface LastResult {
  ordersId: string;
  previousStatus?: string;
  newStatus?: string;
}

/**
 * Admin order-management page.
 *
 * Lets an admin look up an order by id (best-effort) and update its status via
 * `PUT /orders/{OrdersID}/status`. Search degrades gracefully: even when the
 * by-id lookup returns nothing (no guaranteed by-id endpoint), the admin can
 * still choose a status and submit the update. The update response is the
 * authoritative source of order details and is reflected immediately.
 */
export function OrderManagementPage() {
  const [ordersId, setOrdersId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<string | null>(null);

  const updateMutation = useMutation<
    UpdateOrderStatusResponse,
    ApiError,
    { ordersId: string; status: OrderStatus }
  >({
    mutationFn: ({ ordersId: id, status }) => updateOrderStatus(id, status),
    onSuccess: (res, vars) => {
      const updated =
        res.order ??
        (order ? { ...order, OrderStatus: res.newStatus ?? vars.status } : null);
      if (updated) {
        setOrder(updated);
      }
      setSelectedStatus((res.newStatus as OrderStatus) ?? vars.status);
      setLastResult({
        ordersId: res.OrdersID ?? vars.ordersId,
        previousStatus: res.previousStatus,
        newStatus: res.newStatus ?? vars.status,
      });
    },
    onError: () => {
      // Error surfaced via updateMutation.error in the UI below.
    },
  });

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const id = ordersId.trim();
    if (!id) {
      setFormError("Please enter an Orders ID.");
      return;
    }
    setFormError(null);
    setSearchInfo(
      "Order lookup API is not configured. You can still update the order status using the Order ID.",
    );
  };

  const handleUpdate = (event?: React.FormEvent) => {
    event?.preventDefault();
    const id = ordersId.trim();
    if (!id) {
      setFormError("Please enter an Orders ID.");
      return;
    }
    if (!selectedStatus) {
      setFormError("Please select a new status.");
      return;
    }
    setFormError(null);
    if (updateMutation.isPending) {
      return;
    }
    updateMutation.mutate({ ordersId: id, status: selectedStatus });
  };

  const updateDisabled =
    updateMutation.isPending || ordersId.trim() === "" || selectedStatus === "";

  return (
    <div>
      <PageHeader
        title="Order Management"
        description="Look up an order and update its status."
      />

      <SectionCard title="Find & update order">
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="order-management-id" className={labelClasses}>
                Orders ID
              </label>
              <input
                id="order-management-id"
                type="text"
                value={ordersId}
                onChange={(e) => setOrdersId(e.target.value)}
                placeholder="ORD1049"
                className={inputClasses}
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              className={secondaryButtonClasses}
            >
              Search
            </button>
          </div>

          {searchInfo ? (
            <Alert status="default">
              <Alert.Description>{searchInfo}</Alert.Description>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="order-management-status" className={labelClasses}>
                New Status
              </label>
              <select
                id="order-management-status"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as OrderStatus | "")
                }
                className={inputClasses}
              >
                <option value="" disabled>
                  Select status
                </option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={updateDisabled}
              className={primaryButtonClasses}
            >
              {updateMutation.isPending ? "Updating\u2026" : "Update Order Status"}
            </button>
          </div>

          {formError ? (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {formError}
            </p>
          ) : null}
        </form>
      </SectionCard>

      {updateMutation.isSuccess && lastResult ? (
        <div className="mt-6">
          <Alert status="success">
            <Alert.Title>Order updated</Alert.Title>
            <Alert.Description>
              {`Order ${lastResult.ordersId} status updated successfully: ${lastResult.previousStatus ?? "—"} → ${lastResult.newStatus ?? "—"}`}
            </Alert.Description>
          </Alert>
        </div>
      ) : null}

      {updateMutation.isError ? (
        <div className="mt-6">
          <Alert status="danger">
            <Alert.Title>Update failed</Alert.Title>
            <Alert.Description>
              {getApiErrorMessage(updateMutation.error)}
            </Alert.Description>
          </Alert>
        </div>
      ) : null}

      {order ? (
        <div className="mt-6">
          <SectionCard title="Order details">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Orders ID
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.OrdersID)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Current Status
                </dt>
                <dd>
                  <StatusBadge value={order.OrderStatus} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Customer ID
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.CustomerID)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Product ID
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.ProductsID)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Quantity
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {formatQuantity(order.Quantity)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Total Amount
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {formatAmount(order.TotalAmount)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Courier
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.Courier)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Tracking ID
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.TrackingID)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Order Date
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.OrderDate)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Estimated Delivery
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.EstimatedDelivery)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Payment ID
                </dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                  {orDash(order.PaymentID)}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}

export default OrderManagementPage;
