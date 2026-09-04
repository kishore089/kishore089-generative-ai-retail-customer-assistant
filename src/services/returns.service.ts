/**
 * Returns service — calls the live API Gateway endpoint `GET /returns`.
 *
 * Fetches the return list for the active customer and maps each record
 * defensively via the shared parse helpers. No mock data.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

import { extractList, str, num } from "./parse";

export interface ReturnRecord {
  ReturnID: string;
  OrderID: string;
  Status: string;
  Reason: string;
  RefundAmount?: number;
  CreatedDate: string;
}

function mapReturn(rec: Record<string, unknown>): ReturnRecord {
  return {
    ReturnID: str(rec, "ReturnID", "returnId", "id") ?? "",
    OrderID: str(rec, "OrdersID", "OrderID", "orderId") ?? "",
    Status: str(rec, "Status", "status") ?? "",
    Reason: str(rec, "Reason", "reason") ?? "",
    RefundAmount: num(rec, "RefundAmount", "refundAmount", "amount"),
    CreatedDate: str(rec, "CreatedDate", "createdDate", "createdAt", "date") ?? "",
  };
}

/**
 * Retrieves the returns for the given customer from the live backend.
 *
 * @param customerId - Active customer id (always sourced from Customer Context).
 * @throws ApiError - Normalized error on request failure.
 */
export async function getReturns(customerId: string): Promise<ReturnRecord[]> {
  try {
    const res = await api.get("/returns", { params: { customerId } });
    return extractList(res.data).map(mapReturn);
  } catch (err) {
    throw normalizeError(err);
  }
}
