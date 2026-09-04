import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import type { IconBaseProps } from "react-icons";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCircle,
  FiCreditCard,
  FiGrid,
  FiLifeBuoy,
  FiPackage,
  FiRefreshCw,
  FiSettings,
  FiUser,
  FiZap,
} from "react-icons/fi";

import type { NavItem } from "@/types/nav";
import { getNavItems } from "@/routes/navItems";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";

export interface SidebarProps {
  items?: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

type IconComponent = ComponentType<IconBaseProps>;

/**
 * Maps the string `icon` key used by the nav items to a Feather icon
 * component. Unknown keys fall back to a neutral circle icon.
 */
const ICON_MAP: Record<string, IconComponent> = {
  dashboard: FiGrid,
  sparkles: FiZap,
  package: FiPackage,
  return: FiRefreshCw,
  card: FiCreditCard,
  lifebuoy: FiLifeBuoy,
  user: FiUser,
  settings: FiSettings,
};

function resolveIcon(key: string): IconComponent {
  return ICON_MAP[key] ?? FiCircle;
}

/**
 * Vertical navigation sidebar with an enterprise blue-and-white aesthetic.
 *
 * Renders a brand/logo area and a list of {@link NavLink}s derived from the
 * current role and active customer via {@link getNavItems} (overridable via
 * the `items` prop). Collapses to an icon-only rail (w-16) or expands to a full
 * column (w-64). Full-height and sticky.
 */
export function Sidebar(props: SidebarProps) {
  const { collapsed, onToggle } = props;
  const { role } = useAuth();
  const { customerId } = useCustomer();
  const items = props.items ?? getNavItems(role, customerId !== null);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 dark:border-neutral-800 dark:bg-neutral-900 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand / logo */}
      <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-500 text-sm font-bold text-white">
          S
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Support Center
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = resolveIcon(item.icon);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute inset-y-1 left-0 w-1 rounded-r bg-primary-500"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <FiChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <FiChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
