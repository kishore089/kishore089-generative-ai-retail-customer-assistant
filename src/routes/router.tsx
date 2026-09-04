/* eslint-disable react-refresh/only-export-components --
 * This module defines the router configuration (a non-component export) and
 * co-locates the lazy-loaded page component references it wires together, plus
 * a small role-aware index redirect component. It is not a component module, so
 * the Fast Refresh component-only constraint does not apply. */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { Loading } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts";
import { LoginPage } from "@/pages/Login";
import { NotFoundPage } from "@/pages/NotFound";

import { PATHS } from "./paths";
import { resolvePostLoginPath } from "./redirect";
import { RoleRoute } from "./RoleRoute";

/**
 * Application router (Requirements 5.2, 6.1, 7.3, 9.x).
 *
 * The authenticated customer pages plus the two admin pages are code-split via
 * {@link lazy} so their bundles load on demand. They render beneath
 * {@link AppLayout}, whose `<Outlet />` is wrapped in a Suspense boundary that
 * shows a loading fallback while a lazy chunk resolves. Access is gated by
 * {@link RoleRoute} per route.
 *
 * {@link LoginPage} and {@link NotFoundPage} are imported eagerly because they
 * render outside {@link AppLayout} and therefore have no Suspense boundary of
 * their own.
 */
const DashboardPage = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.DashboardPage })),
);
const AIAssistantPage = lazy(() =>
  import("@/pages/AIAssistant").then((m) => ({ default: m.AIAssistantPage })),
);
const OrdersPage = lazy(() =>
  import("@/pages/Orders").then((m) => ({ default: m.OrdersPage })),
);
const ReturnsPage = lazy(() =>
  import("@/pages/Returns").then((m) => ({ default: m.ReturnsPage })),
);
const PaymentsPage = lazy(() =>
  import("@/pages/Payments").then((m) => ({ default: m.PaymentsPage })),
);
const SupportPage = lazy(() =>
  import("@/pages/Support").then((m) => ({ default: m.SupportPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/Profile").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/Settings").then((m) => ({ default: m.SettingsPage })),
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/AdminDashboard").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const CustomerSearchPage = lazy(() =>
  import("@/pages/CustomerSearch").then((m) => ({
    default: m.CustomerSearchPage,
  })),
);
const OrderManagementPage = lazy(() =>
  import("@/pages/OrderManagement").then((m) => ({
    default: m.OrderManagementPage,
  })),
);

/**
 * Index route element: sends the authenticated user to their role landing
 * page. While the session is resolving, a fullscreen loading indicator is
 * shown; unauthenticated users are sent to login (Requirement 7.3).
 */
function RoleIndexRedirect() {
  const { status, role } = useAuth();

  if (status === "loading") {
    return <Loading fullscreen />;
  }

  if (role) {
    return <Navigate to={resolvePostLoginPath(role)} replace />;
  }

  return <Navigate to={PATHS.login} replace />;
}

export const router = createBrowserRouter([
  {
    path: PATHS.root,
    element: (
      <RoleRoute>
        <AppLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <RoleIndexRedirect /> },
      {
        path: "dashboard",
        element: (
          <RoleRoute customerScoped>
            <DashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: "ai-assistant",
        element: (
          <RoleRoute customerScoped>
            <AIAssistantPage />
          </RoleRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <RoleRoute customerScoped>
            <OrdersPage />
          </RoleRoute>
        ),
      },
      {
        path: "returns",
        element: (
          <RoleRoute customerScoped>
            <ReturnsPage />
          </RoleRoute>
        ),
      },
      {
        path: "payments",
        element: (
          <RoleRoute customerScoped>
            <PaymentsPage />
          </RoleRoute>
        ),
      },
      {
        path: "support",
        element: (
          <RoleRoute customerScoped>
            <SupportPage />
          </RoleRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <RoleRoute customerScoped>
            <ProfilePage />
          </RoleRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleRoute customerScoped>
            <SettingsPage />
          </RoleRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <RoleRoute adminOnly isAdminDashboard>
            <AdminDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: "admin/customers",
        element: (
          <RoleRoute adminOnly>
            <CustomerSearchPage />
          </RoleRoute>
        ),
      },
      {
        path: "admin/orders",
        element: (
          <RoleRoute adminOnly>
            <OrderManagementPage />
          </RoleRoute>
        ),
      },
    ],
  },
  { path: PATHS.login, element: <LoginPage /> },
  { path: PATHS.notFound, element: <NotFoundPage /> },
]);

export default router;
