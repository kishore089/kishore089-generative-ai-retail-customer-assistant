import { FiLogOut, FiMenu, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { PATHS } from "@/routes/paths";
import { ThemeToggle } from "./ThemeToggle";

export interface TopNavbarProps {
  onMenuClick: () => void;
}

/**
 * Application top bar for the enterprise support center.
 *
 * Left: a menu toggle button (drives sidebar collapse / mobile drawer) and the
 * product title. Right: the {@link ThemeToggle} and a minimal user area showing
 * the signed-in display name with a sign-out action.
 */
export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Left: menu toggle + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <FiMenu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Customer Support Center
        </span>
      </div>

      {/* Right: theme toggle + user menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-700 dark:text-neutral-200">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                aria-hidden="true"
              >
                <FiUser className="h-4 w-4" />
              </span>
              <span className="hidden max-w-[10rem] truncate font-medium sm:inline">
                {user.displayName}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  await signOut();
                  navigate(PATHS.login, { replace: true });
                })();
              }}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <FiLogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
