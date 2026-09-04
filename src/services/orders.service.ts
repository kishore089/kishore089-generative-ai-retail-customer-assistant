/**
 * Orders service — calls the live API Gateway endpoint `GET /orders`.
 *
 * Fetches the order list for the active customer and maps each record
 * defensively via the shared parse helpers. No mock data.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

import { extractList, str, num, bool } from "./parse";

export interface Order {
  OrderID: string;
  ProductName: string;
  Status: string;
  OrderDate: string;
  ExpectedDelivery?: string;
  TrackingID?: string;
  Courier?: string;
  OrderAmount?: number;
  CancelEligibility?: boolean;
}

function mapOrder(rec: Record<string, unknown>): Order {
  return {
    OrderID: str(rec, "OrderID", "orderId", "id") ?? "",
    ProductName: str(rec, "ProductName", "productName", "product") ?? "",
    Status: str(rec, "Status", "status") ?? "",
    OrderDate: str(rec, "OrderDate", "orderDate", "date", "createdAt") ?? "",
    ExpectedDelivery: str(rec, "ExpectedDelivery", "expectedDelivery"),
    TrackingID: str(rec, "TrackingID", "trackingId", "tracking"),
    Courier: str(rec, "Courier", "courier"),
    OrderAmount: num(rec, "OrderAmount", "orderAmount", "amount", "total"),
    CancelEligibility: bool(
      rec,
      "CancelEligibility",
      "cancelEligibility",
      "cancellable",
      "canCancel",
    ),
  };
}

/**
 * Retrieves the orders for the given customer from the live backend.
 *
 * @param customerId - Active customer id (always sourced from Customer Context).
 * @throws ApiError - Normalized error on request failure.
 */
export async function getOrders(customerId: string): Promise<Order[]> {
  try {
    const res = await api.get("/orders", { params: { customerId } });
    console.log("[ordersService] GET /orders response:", res.data);
    const body = res.data as { data?: { activeOrders?: unknown } } | undefined;
    const activeOrders = body?.data?.activeOrders;
    const list = Array.isArray(activeOrders)
      ? activeOrders.filter(
          (i): i is Record<string, unknown> =>
            typeof i === "object" && i !== null,
        )
      : extractList(res.data);
    return list.map(mapOrder);
  } catch (err) {
    throw normalizeError(err);
  }
}
