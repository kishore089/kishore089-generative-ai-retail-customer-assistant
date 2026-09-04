import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Loading } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";

import { PATHS } from "./paths";

export interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guards protected routes based on the current auth status (Requirements
 * 7.1-7.5).
 *
 * - While the session is being resolved, a fullscreen loading indicator is
 *   shown and no protected content is rendered (Requirement 7.3).
 * - When unauthenticated, the user is redirected to the login route. The
 *   originally requested path (including query string) is preserved in the
 *   navigation state so it can be restored after sign-in, and the protected
 *   content is never rendered (Requirements 7.2, 7.4).
 * - When authenticated, the protected children are rendered (Requirement 7.1).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <Loading fullscreen label="Checking your session…" />;
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={PATHS.login}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
