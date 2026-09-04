import type { Role } from "@/types/user";
import type { NavItem } from "@/types/nav";
import { PATHS } from "./paths";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: PATHS.dashboard, icon: "dashboard" },
  { label: "AI Assistant", to: PATHS.aiAssistant, icon: "sparkles" },
  { label: "My Orders", to: PATHS.orders, icon: "package" },
  { label: "Returns & Refunds", to: PATHS.returns, icon: "return" },
  { label: "Payments", to: PATHS.payments, icon: "card" },
  { label: "Support Tickets", to: PATHS.support, icon: "lifebuoy" },
  { label: "Profile", to: PATHS.profile, icon: "user" },
  { label: "Settings", to: PATHS.settings, icon: "settings" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Dashboard", to: PATHS.adminDashboard, icon: "dashboard" },
  { label: "Customer Search", to: PATHS.customerSearch, icon: "user" },
  { label: "Order Management", to: PATHS.orderManagement, icon: "package" },
];

const ADMIN_CUSTOMER_SCOPED_ITEMS: NavItem[] = [
  { label: "Customer Dashboard", to: PATHS.dashboard, icon: "dashboard" },
  { label: "AI Assistant", to: PATHS.aiAssistant, icon: "sparkles" },
  { label: "My Orders", to: PATHS.orders, icon: "package" },
  { label: "Returns & Refunds", to: PATHS.returns, icon: "return" },
  { label: "Payments", to: PATHS.payments, icon: "card" },
  { label: "Support Tickets", to: PATHS.support, icon: "lifebuoy" },
  { label: "Profile", to: PATHS.profile, icon: "user" },
];

/**
 * Derive the sidebar navigation for the current role and customer context.
 *
 * - Customer: the full set of customer items.
 * - Admin without an active customer: admin-only items.
 * - Admin with an active customer: admin items plus the customer-scoped items.
 * - Unauthenticated (role === null): empty.
 */
export function getNavItems(
  role: Role | null,
  hasActiveCustomer: boolean,
): NavItem[] {
  if (role === "Customer") {
    return NAV_ITEMS;
  }
  if (role === "Admin") {
    return hasActiveCustomer
      ? [...ADMIN_NAV_ITEMS, ...ADMIN_CUSTOMER_SCOPED_ITEMS]
      : ADMIN_NAV_ITEMS;
  }
  return [];
}
