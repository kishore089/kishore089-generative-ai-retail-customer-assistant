/**
 * Payments service — calls the live API Gateway endpoint `GET /payments`.
 *
 * Fetches the payment list for the active customer and maps each record
 * defensively via the shared parse helpers. No mock data.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

import { extractList, str, num } from "./parse";

export interface Payment {
  PaymentID: string;
  OrderID: string;
  Amount: number;
  Status: string;
  Method: string;
  Date: string;
}

function mapPayment(rec: Record<string, unknown>): Payment {
  return {
    PaymentID: str(rec, "PaymentID", "paymentId", "id") ?? "",
    OrderID: str(rec, "OrdersID", "OrderID", "orderId") ?? "",
    Amount: num(rec, "Amount", "amount") ?? 0,
    Status: str(rec, "PaymentStatus", "Status", "status") ?? "",
    Method: str(rec, "PaymentMethod", "Method", "method") ?? "",
    Date: str(rec, "PaymentDate", "Date", "date", "createdAt") ?? "",
  };
}

/**
 * Retrieves the payments for the given customer from the live backend.
 *
 * @param customerId - Active customer id (always sourced from Customer Context).
 * @throws ApiError - Normalized error on request failure.
 */
export async function getPayments(customerId: string): Promise<Payment[]> {
  try {
    const res = await api.get("/payments", { params: { customerId } });
    return extractList(res.data).map(mapPayment);
  } catch (err) {
    throw normalizeError(err);
  }
}
