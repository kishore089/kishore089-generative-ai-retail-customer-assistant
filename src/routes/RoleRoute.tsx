import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Loading } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";

import { PATHS } from "./paths";
import { resolveRouteAccess, type RouteKind } from "./redirect";

export interface RoleRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  customerScoped?: boolean;
  isAdminDashboard?: boolean;
}

/**
 * Guards routes based on role and active-customer context, delegating the
 * decision to the pure {@link resolveRouteAccess} function (Requirements 9.x).
 *
 * - While the session resolves, a fullscreen loading indicator is shown.
 * - On a redirect decision, navigates to the resolved path. When redirecting to
 *   login, the originally requested path (including query string) is preserved
 *   in navigation state so it can be restored after sign-in.
 * - On an allow decision, renders the guarded children.
 */
export function RoleRoute({
  children,
  adminOnly,
  customerScoped,
  isAdminDashboard,
}: RoleRouteProps) {
  const { status, role } = useAuth();
  const { customerId } = useCustomer();
  const location = useLocation();

  const routeKind: RouteKind = adminOnly
    ? "adminOnly"
    : customerScoped
      ? "customerScoped"
      : "authOnly";

  const decision = resolveRouteAccess({
    status,
    role,
    hasActiveCustomer: customerId !== null,
    routeKind,
    isAdminDashboard: isAdminDashboard ?? false,
  });

  if (decision.type === "loading") {
    return <Loading fullscreen label="Checking access…" />;
  }

  if (decision.type === "redirect") {
    return (
      <Navigate
        to={decision.to}
        replace
        state={
          decision.to === PATHS.login
            ? { from: location.pathname + location.search }
            : undefined
        }
      />
    );
  }

  return <>{children}</>;
}

export default RoleRoute;
