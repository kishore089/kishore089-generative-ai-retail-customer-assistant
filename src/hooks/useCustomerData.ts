/**
 * React Query hooks for per-customer domain data.
 *
 * Each hook reads the active `customerId` from Customer Context and keys its
 * cache by that id, so switching customers refetches / caches per-customer
 * (satisfying "invalidate on customer change"). Queries are disabled until a
 * customer is active.
 */

import { useQuery } from "@tanstack/react-query";

import { useCustomer } from "@/contexts/CustomerContext";
import {
  getOrders,
  getPayments,
  getReturns,
  getSupportTickets,
  type Order,
  type Payment,
  type ReturnRecord,
  type SupportTicket,
} from "@/services";
import type { ApiError } from "@/types/api";

export function useOrders() {
  const { customerId } = useCustomer();
  return useQuery<Order[], ApiError>({
    queryKey: ["orders", customerId],
    queryFn: () => getOrders(customerId as string),
    enabled: customerId !== null,
  });
}

export function usePayments() {
  const { customerId } = useCustomer();
  return useQuery<Payment[], ApiError>({
    queryKey: ["payments", customerId],
    queryFn: () => getPayments(customerId as string),
    enabled: customerId !== null,
  });
}

export function useReturns() {
  const { customerId } = useCustomer();
  return useQuery<ReturnRecord[], ApiError>({
    queryKey: ["returns", customerId],
    queryFn: () => getReturns(customerId as string),
    enabled: customerId !== null,
  });
}

export function useSupportTickets() {
  const { customerId } = useCustomer();
  return useQuery<SupportTicket[], ApiError>({
    queryKey: ["support", customerId],
    queryFn: () => getSupportTickets(customerId as string),
    enabled: customerId !== null,
  });
}
