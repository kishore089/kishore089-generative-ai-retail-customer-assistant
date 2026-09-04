/**
 * User domain types for Phase 2 (auth, RBAC & customer context).
 *
 * These types back the mock `UserService`/`AuthService` and are defined behind
 * interfaces so a Cognito-/API-Gateway-backed implementation can replace the
 * mock later without changing any consumer.
 *
 * Requirements: 1.1, 2.1, 2.2.
 */

/** A user classification: exactly one of `Customer` or `Admin`. */
export type Role = "Customer" | "Admin";

/** Lifecycle status of a user account. */
export type UserStatus = "active" | "inactive" | "suspended";

/**
 * A user record.
 *
 * Invariant: `CustomerID === null` if and only if `Role === "Admin"`.
 * (Every Admin has a null `CustomerID`; every Customer has a non-null one.)
 */
export interface User {
  UserID: string;
  CustomerID: string | null;
  Name: string;
  Email: string;
  Role: Role;
  Status: UserStatus;
}

/** Credentials submitted on a login form. */
export interface Credentials {
  email: string;
  password: string;
}
