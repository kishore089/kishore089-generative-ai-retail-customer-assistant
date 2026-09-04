/**
 * Recently-opened customers (admin).
 *
 * Tracks the customers an admin has actually opened, persisted in
 * localStorage. This is real, user-driven history — not mock/seeded data. All
 * access is SSR-safe and guarded so a corrupt or unavailable store degrades to
 * an empty list rather than throwing.
 *
 * Requirements: 6.3.
 */

import type { Customer } from "@/types/customer";

const KEY = "app.recentCustomers";
const MAX = 5;

/** Narrows an unknown value to a Customer-shaped record with a string id. */
function isCustomerLike(value: unknown): value is Customer {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { CustomerID?: unknown }).CustomerID === "string"
  );
}

/** Returns the persisted recent customers, or `[]` on any failure. */
export function getRecentCustomers(): Customer[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCustomerLike);
  } catch {
    return [];
  }
}

/**
 * Records a customer as most-recently opened: dedupes by CustomerID, moves it
 * to the front, and caps the list to `MAX` entries.
 */
export function addRecentCustomer(customer: Customer): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  if (!isCustomerLike(customer)) {
    return;
  }
  try {
    const existing = getRecentCustomers().filter(
      (c) => c.CustomerID !== customer.CustomerID,
    );
    const next = [customer, ...existing].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore write failures (quota, disabled storage, etc.).
  }
}

/** Clears the persisted recent-customers list. */
export function clearRecentCustomers(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore removal failures.
  }
}
