/**
 * Admin customer search service (live API).
 *
 * Calls the real customer search endpoint (`GET /customer-search`) via the
 * shared Axios instance. Only fields the admin actually provided are sent as
 * query params; an empty query short-circuits to no results. The response is
 * parsed defensively because the endpoint may return a single object, an
 * array, or a nested envelope.
 *
 * Requirements: 6.2, 6.3, 11.1, 11.4.
 */

import { api } from "@/services/api";
import { mapCustomer, type CustomerApiData } from "@/services/customerMapper";
import type { Customer } from "@/types/customer";
import { normalizeError } from "@/utils/http/normalizeError";

export interface CustomerSearchParams {
  customerId?: string;
  email?: string;
  phone?: string;
}

/** Narrows an unknown value to a plain (non-null, non-array) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extracts an array of raw customer records from an arbitrary response body.
 * Handles: `{ success, data: [...] }`, `{ data: { CustomerID... } }` (single),
 * `{ data: { customers: [...] } }` (nested), a bare array, or nothing.
 */
function extractCustomerArray(body: unknown): unknown[] {
  if (isPlainObject(body) && body.success === false) {
    return [];
  }

  const data = isPlainObject(body) ? body.data : undefined;

  if (Array.isArray(data)) {
    return data;
  }

  if (isPlainObject(data)) {
    if (typeof data.CustomerID === "string") {
      return [data];
    }
    // Pick the first array-valued property (e.g. customers/results).
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  }

  if (Array.isArray(body)) {
    return body;
  }

  return [];
}

/**
 * Searches customers by the provided identifiers. Returns an empty array when
 * no search field is provided. Throws a normalized `ApiError` on request
 * failure.
 */
export async function searchCustomers(
  params: CustomerSearchParams,
): Promise<Customer[]> {
  const query: Record<string, string> = {};
  const customerId = params.customerId?.trim();
  const email = params.email?.trim();
  const phone = params.phone?.trim();
  if (customerId) query.customerId = customerId;
  if (email) query.email = email;
  if (phone) query.phone = phone;

  if (Object.keys(query).length === 0) {
    return [];
  }

  try {
    const res = await api.get("/customer-search", { params: query });
    const rows = extractCustomerArray(res.data);
    return rows
      .filter(isPlainObject)
      .map((row) => mapCustomer(row as CustomerApiData));
  } catch (err) {
    throw normalizeError(err);
  }
}
