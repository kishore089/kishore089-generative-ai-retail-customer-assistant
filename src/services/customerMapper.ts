/**
 * Customer mapping (shared).
 *
 * Centralizes the raw-API -> domain `Customer` mapping so both the customer
 * profile lookup (`GET /customer`) and the admin customer search
 * (`GET /customer-search`) reuse identical, defensive parsing.
 *
 * Requirements: 5.1, 6.2, 6.3.
 */

import type { Customer } from "@/types/customer";

/** Raw customer payload as returned by the API (PascalCase fields). */
export interface CustomerApiData {
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
  // The endpoint may include additional, unknown fields.
  [key: string]: unknown;
}

/** Maps a raw API payload into the domain `Customer`, defensively. */
export function mapCustomer(data: CustomerApiData): Customer {
  const rewardPoints =
    data.RewardPoints === undefined || data.RewardPoints === null
      ? undefined
      : Number(data.RewardPoints);

  const membershipBenefits =
    Array.isArray(data.MembershipBenefits) &&
    data.MembershipBenefits.every((b) => typeof b === "string")
      ? data.MembershipBenefits
      : undefined;

  // Reads the first defined value from a list of candidate keys, coercing to a
  // string when present, else undefined. The API is PascalCase but we accept
  // sensible fallbacks defensively via the index signature.
  const readString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const raw = data[key];
      if (typeof raw === "string") {
        return raw;
      }
    }
    return undefined;
  };

  return {
    CustomerID: data.CustomerID,
    Name: data.Name,
    Email: data.Email,
    Phone: data.Phone,
    Membership: data.Membership,
    RewardPoints:
      rewardPoints !== undefined && Number.isNaN(rewardPoints)
        ? undefined
        : rewardPoints,
    Address: data.Address,
    City: data.City,
    State: data.State,
    Status: readString("Status", "status"),
    MembershipBenefits: membershipBenefits,
    JoinedDate: readString(
      "JoinedDate",
      "joinedDate",
      "JoinDate",
      "MemberSince",
      "CreatedDate",
    ),
    PreferredLanguage: readString(
      "PreferredLanguage",
      "preferredLanguage",
      "Language",
    ),
    PreferredPaymentMethod: readString(
      "PreferredPaymentMethod",
      "preferredPaymentMethod",
      "PaymentMethod",
    ),
    PreferredDeliveryAddress: readString(
      "PreferredDeliveryAddress",
      "preferredDeliveryAddress",
      "DeliveryAddress",
    ),
  };
}
