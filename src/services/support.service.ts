/**
 * Support service — calls the live API Gateway endpoint `GET /support`.
 *
 * Fetches the support ticket list for the active customer and maps each record
 * defensively via the shared parse helpers. No mock data.
 */

import { api } from "@/services/api";
import { normalizeError } from "@/utils/http/normalizeError";

import { extractList, str } from "./parse";

export interface SupportTicket {
  TicketID: string;
  OrderID: string;
  Issue: string;
  Priority: string;
  Status: string;
  CreatedDate: string;
  AssignedAgent?: string;
}

function mapSupportTicket(rec: Record<string, unknown>): SupportTicket {
  return {
    TicketID: str(rec, "TicketsID", "TicketID", "ticketId", "id") ?? "",
    OrderID: str(rec, "OrdersID", "OrderID", "orderId") ?? "",
    Issue: str(rec, "Issue", "issue", "subject", "description") ?? "",
    Priority: str(rec, "Priority", "priority") ?? "",
    Status: str(rec, "Status", "status") ?? "",
    CreatedDate: str(rec, "CreatedDate", "createdDate", "createdAt", "date") ?? "",
    AssignedAgent: str(rec, "AssignedAgent", "assignedAgent", "agent"),
  };
}

/**
 * Retrieves the support tickets for the given customer from the live backend.
 *
 * @param customerId - Active customer id (always sourced from Customer Context).
 * @throws ApiError - Normalized error on request failure.
 */
export async function getSupportTickets(
  customerId: string,
): Promise<SupportTicket[]> {
  try {
    const res = await api.get("/support", { params: { customerId } });
    return extractList(res.data).map(mapSupportTicket);
  } catch (err) {
    throw normalizeError(err);
  }
}
