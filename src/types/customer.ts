/**
 * Customer domain types.
 *
 * Maps the live Customer Profile API response (`GET /customer?customerId=...`).
 * Backs the `CustomerService` and the global `CustomerContext`. Defined behind
 * interfaces so the API-Gateway-backed implementation can evolve without
 * changing any consumer.
 *
 * Requirements: 5.1, 6.2.
 */

/** A customer record as returned by the Customer Profile API. */
export interface Customer {
  CustomerID: string;
  Name: string;
  Email: string;
  Phone: string;
  Membership?: string;
  RewardPoints?: number;
  Address?: string;
  City?: string;
  State?: string;
  Status?: string;
  MembershipBenefits?: string[];
  JoinedDate?: string;
  PreferredLanguage?: string;
  PreferredPaymentMethod?: string;
  PreferredDeliveryAddress?: string;
}

/**
 * A customer search query. Any subset of the fields may be provided; absent
 * fields are ignored by the search. An all-empty query returns no matches.
 */
export interface CustomerSearchQuery {
  customerId?: string;
  email?: string;
  phone?: string;
}
