import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { Order } from "@/services/orders.service";
import { getProduct } from "@/services/product.service";
import type { Product } from "@/services/product.service";
import { updateOrderStatus } from "@/services/orderManagement.service";
import type { UpdateOrderStatusResponse } from "@/services/orderManagement.service";
import type { ApiError } from "@/types/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export interface OrderCardProps {
  order: Order;
  /** Invoked after a successful cancellation (e.g. to post a chat confirmation). */
  onCancelled?: (order: Order, response: UpdateOrderStatusResponse) => void;
}

/** Tailwind color scheme keyed to a normalized (lowercased) order status. */
function statusClasses(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "delivered") {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  }
  if (s === "shipped" || s === "out for delivery" || s === "outfordelivery") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  }
  if (s === "confirmed" || s === "processing") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }
  if (s === "cancelled" || s === "canceled") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  }
  if (s === "returned") {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
  }
  return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
}

/** Format an optional amount with grouping; no currency symbol is assumed. */
function formatAmount(value: number | undefined): string | null {
  if (value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/** Tracking is actionable only when a non-empty, non-"Pending" id exists. */
function hasTracking(order: Order): boolean {
  const t = order.TrackingID?.trim() ?? "";
  return t !== "" && t.toLowerCase() !== "pending";
}

/** Emoji dot reflecting product stock availability. */
function stockDot(status: string): string {
  const s = status.trim().toLowerCase();
  if (s.includes("out")) {
    return "\uD83D\uDD34"; // red
  }
  if (s.includes("in stock")) {
    return "\uD83D\uDFE2"; // green
  }
  return "\uD83D\uDFE1"; // yellow / limited
}

/**
 * Compact, responsive live order summary rendered inside the AI chat beneath an
 * OrderStatus response. All order values come from the live `getOrders` result;
 * the product name is resolved from the live `GET /products` service.
 *
 * Cancellation reuses the existing `updateOrderStatus(orderId, "Cancelled")`
 * service (PUT /orders/{id}/status). The Cancel Order button is shown solely
 * when `CancelEligibility === true` (never inferred from Status). Clicking it
 * opens a confirmation dialog; only an explicit confirm calls the API. On
 * success the card status flips to the returned status (Cancelled), the button
 * is removed, and `onCancelled` fires. On failure the order is left unchanged
 * and a friendly error is shown in the dialog.
 */
export function OrderCard({ order, onCancelled }: OrderCardProps) {
  const amount = formatAmount(order.OrderAmount);
  const trackable = hasTracking(order);

  const [modalOpen, setModalOpen] = useState(false);
  const [cancelledStatus, setCancelledStatus] = useState<string | null>(null);

  const cancelMutation = useMutation<UpdateOrderStatusResponse, ApiError, void>({
    mutationFn: () => updateOrderStatus(order.OrderID, "Cancelled"),
    onSuccess: (res) => {
      setCancelledStatus(res.newStatus?.trim() || "Cancelled");
      setModalOpen(false);
      onCancelled?.(order, res);
    },
  });

  const status = cancelledStatus ?? order.Status.trim();
  const canCancel =
    order.CancelEligibility === true && cancelledStatus === null;
  const showUnavailable =
    order.CancelEligibility === false && cancelledStatus === null;

  // The backend places the product id in the order's ProductName field.
  const productId = order.ProductName.trim();
  const { data: product, isLoading: productLoading } = useQuery<
    Product,
    ApiError
  >({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: productId !== "",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const resolvedName = product?.ProductName.trim() ?? "";
  const brandCategory = product
    ? [product.Brand?.trim() ?? "", product.Category?.trim() ?? ""]
        .filter((v) => v !== "")
        .join(" \u2022 ")
    : "";
  const hasRating =
    product !== undefined &&
    typeof product.Rating === "number" &&
    Number.isFinite(product.Rating);
  const stockStatus = product?.StockStatus?.trim() ?? "";

  const handleConfirmCancel = () => {
    if (cancelMutation.isPending) {
      return;
    }
    cancelMutation.mutate();
  };

  const handleCloseModal = () => {
    if (cancelMutation.isPending) {
      return;
    }
    setModalOpen(false);
  };

  const showFooter = trackable || canCancel || showUnavailable;

  return (
    <div className="mt-1 w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {"\uD83D\uDCE6"} Order #{order.OrderID}
        </span>
        {status !== "" ? (
          <span
            className={
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize " +
              statusClasses(status)
            }
          >
            {status}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {productId !== "" ? (
          <div className="flex flex-col gap-0.5">
            {productLoading ? (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {"\uD83D\uDCBB"} Loading product&hellip;
              </span>
            ) : resolvedName !== "" ? (
              <>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {"\uD83D\uDCBB"} {resolvedName}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Product ID: {productId}
                </span>
                {brandCategory !== "" ? (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {brandCategory}
                  </span>
                ) : null}
                {hasRating || stockStatus !== "" ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {hasRating ? (
                      <span className="text-xs text-neutral-600 dark:text-neutral-300">
                        {"\u2B50"} {product?.Rating}
                      </span>
                    ) : null}
                    {stockStatus !== "" ? (
                      <span className="text-xs text-neutral-600 dark:text-neutral-300">
                        {stockDot(stockStatus)} {stockStatus}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {"\uD83D\uDCBB"} Product
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Product ID: {productId}
                </span>
              </>
            )}
          </div>
        ) : null}

        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {order.Courier && order.Courier.trim() !== "" ? (
            <div className="flex flex-col">
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                {"\uD83D\uDE9A"} Courier
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                {order.Courier}
              </dd>
            </div>
          ) : null}
          {order.TrackingID && order.TrackingID.trim() !== "" ? (
            <div className="flex flex-col">
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                {"\uD83D\uDCCD"} Tracking ID
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                {order.TrackingID}
              </dd>
            </div>
          ) : null}
          {order.ExpectedDelivery && order.ExpectedDelivery.trim() !== "" ? (
            <div className="flex flex-col">
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                {"\uD83D\uDCC5"} Expected Delivery
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                {order.ExpectedDelivery}
              </dd>
            </div>
          ) : null}
          {amount !== null ? (
            <div className="flex flex-col">
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                {"\uD83D\uDCB0"} Order Amount
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-50">
                {amount}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {cancelledStatus !== null ? (
        <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-700">
          <p className="text-xs font-medium text-green-700 dark:text-green-400">
            {"\u2713"} Order {order.OrderID} has been cancelled successfully.
          </p>
        </div>
      ) : null}

      {showFooter ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          {trackable ? (
            <button
              type="button"
              disabled
              title="Tracking integration coming soon"
              className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white opacity-60"
            >
              Track Order
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/60 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Cancel Order
            </button>
          ) : null}
          {showUnavailable ? (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {"\uD83D\uDD12"} Cancellation unavailable
            </span>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={modalOpen}
        title="Cancel Order?"
        description={`Are you sure you want to cancel Order #${order.OrderID}? This action cannot be undone.`}
        confirmLabel="Confirm Cancellation"
        loadingLabel={"\u23F3 Cancelling order\u2026"}
        cancelLabel="Keep Order"
        destructive
        loading={cancelMutation.isPending}
        error={
          cancelMutation.isError
            ? "Unable to cancel this order. Please try again."
            : null
        }
        onConfirm={handleConfirmCancel}
        onCancel={handleCloseModal}
      />
    </div>
  );
}

export default OrderCard;
