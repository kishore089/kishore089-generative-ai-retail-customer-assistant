/**
 * Admin order-management service (live API).
 *
 * Wraps the deployed order-status endpoint via the shared Axios instance:
 *   PUT /orders/{OrdersID}/status  body { OrdersID, OrderStatus }
 *
 * The response returned by {@link updateOrderStatus} is the authoritative
 * source of order details.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
];

export interface AdminOrder {
  OrdersID: string;
  OrderStatus: string;
  Courier?: string;
  CustomerID?: string;
  EstimatedDelivery?: string;
  OrderDate?: string;
  PaymentID?: string;
  ProductsID?: string;
  Quantity?: number;
  TotalAmount?: number;
  TrackingID?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message?: string;
  OrdersID?: string;
  previousStatus?: string;
  newStatus?: string;
  order?: AdminOrder;
}

/** Narrows an unknown value to a plain (non-null, non-array) object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns the first key whose value is a non-empty string; otherwise
 * `undefined`.
 */
function optionalString(
  rec: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Returns the first key coercible to a finite number; otherwise `undefined`.
 */
function toNumber(
  rec: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

/**
 * Defensively maps an arbitrary value into an {@link AdminOrder}.
 *
 * Requires an OrdersID string (accepting several common key spellings). Returns
 * `null` when no id can be found so callers can treat the record as absent.
 */
function parseAdminOrder(value: unknown): AdminOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const ordersId = optionalString(value, "OrdersID", "OrderID", "orderId", "id");
  if (ordersId === undefined) {
    return null;
  }

  return {
    OrdersID: ordersId,
    OrderStatus: optionalString(value, "OrderStatus", "status") ?? "",
    Courier: optionalString(value, "Courier"),
    CustomerID: optionalString(value, "CustomerID"),
    EstimatedDelivery: optionalString(value, "EstimatedDelivery"),
    OrderDate: optionalString(value, "OrderDate"),
    PaymentID: optionalString(value, "PaymentID"),
    ProductsID: optionalString(value, "ProductsID"),
    Quantity: toNumber(value, "Quantity"),
    TotalAmount: toNumber(value, "TotalAmount"),
    TrackingID: optionalString(value, "TrackingID"),
  };
}

/**
 * Updates an order's status via `PUT /orders/{OrdersID}/status`.
 *
 * Sends `{ OrdersID, OrderStatus }` and defensively parses the response, which
 * may sit at the top level or nested under `data`. The returned `order` (when
 * present) is the authoritative post-update snapshot.
 *
 * @throws ApiError - Normalized error on request failure.
 */
export async function updateOrderStatus(
  ordersId: string,
  status: OrderStatus,
): Promise<UpdateOrderStatusResponse> {
  try {
    const res = await api.put(
      `/orders/${encodeURIComponent(ordersId)}/status`,
      { OrdersID: ordersId, OrderStatus: status },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 },
    );

    const body: unknown = res.data;
    const rec = isRecord(body)
      ? isRecord(body.data)
        ? body.data
        : body
      : {};

    const success =
      typeof rec.success === "boolean" ? rec.success : false;

    return {
      success,
      message: optionalString(rec, "message"),
      OrdersID: optionalString(rec, "OrdersID", "OrderID", "orderId", "id"),
      previousStatus: optionalString(rec, "previousStatus"),
      newStatus: optionalString(rec, "newStatus"),
      order: parseAdminOrder(rec.order) ?? undefined,
    };
  } catch (err) {
    throw normalizeError(err);
  }
}
