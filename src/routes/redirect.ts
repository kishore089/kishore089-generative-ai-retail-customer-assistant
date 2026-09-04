import type { AuthStatus } from "@/types/auth";
import type { Role } from "@/types/user";
import { PATHS } from "./paths";

/**
 * The access classification of a route, used to drive routing decisions.
 * - `public`: reachable without authentication (e.g. login).
 * - `authOnly`: requires authentication, no role/customer constraints.
 * - `adminOnly`: Admin_Dashboard, Customer_Search.
 * - `customerScoped`: Orders, Returns, Payments, Support, Profile, AI Assistant,
 *   Customer_Dashboard — requires a Customer (own context) or an Admin with an
 *   active customer selected.
 */
export type RouteKind = "public" | "authOnly" | "adminOnly" | "customerScoped";

export interface AccessInput {
  status: AuthStatus;
  role: Role | null;
  hasActiveCustomer: boolean;
  routeKind: RouteKind;
  /** Whether the current route is specifically the Admin Dashboard. */
  isAdminDashboard: boolean;
}

export type AccessDecision =
  | { type: "loading" }
  | { type: "redirect"; to: string }
  | { type: "allow" };

/**
 * Pure, total routing access decision. Given the auth/customer context and the
 * requirements of the target route, returns whether to show a loading state,
 * redirect, or render the route.
 *
 * Requirements: 3.x (role-based routing decision flow).
 */
export function resolveRouteAccess(input: AccessInput): AccessDecision {
  const { status, role, hasActiveCustomer, routeKind, isAdminDashboard } = input;

  if (status === "loading") {
    return { type: "loading" };
  }

  if (status === "unauthenticated") {
    return routeKind === "public"
      ? { type: "allow" }
      : { type: "redirect", to: PATHS.login };
  }

  // status === "authenticated"
  switch (routeKind) {
    case "public":
    case "authOnly":
      return { type: "allow" };

    case "adminOnly": {
      if (role !== "Admin") {
        return { type: "redirect", to: PATHS.dashboard };
      }
      if (isAdminDashboard && hasActiveCustomer) {
        return { type: "redirect", to: PATHS.dashboard };
      }
      return { type: "allow" };
    }

    case "customerScoped": {
      if (role === "Customer") {
        return { type: "allow" };
      }
      if (role === "Admin") {
        return hasActiveCustomer
          ? { type: "allow" }
          : { type: "redirect", to: PATHS.customerSearch };
      }
      // role === null
      return { type: "redirect", to: PATHS.login };
    }

    default: {
      // Exhaustiveness guard: RouteKind is fully handled above.
      const _exhaustive: never = routeKind;
      return _exhaustive;
    }
  }
}

/**
 * The landing path immediately after a successful login, keyed by role.
 * Customers land on their dashboard; Admins land on the admin dashboard.
 */
export function resolvePostLoginPath(role: Role): string {
  return role === "Admin" ? PATHS.adminDashboard : PATHS.dashboard;
}
