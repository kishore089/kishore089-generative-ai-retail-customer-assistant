/* eslint-disable react-refresh/only-export-components --
 * This context module intentionally co-locates the AppStateProvider component
 * with the useAppState hook and the AppState type contracts. Splitting them
 * would fragment the global-state abstraction; Fast Refresh is a dev-only
 * concern that does not apply to these stable exports. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * Global client-only UI state for the Application.
 *
 * NOTE (Requirement 8.3): This context holds ONLY client-side global UI state.
 * Server-derived data MUST stay in React Query (the Query_Client) and must not
 * be duplicated here. Add new client-only, cross-cutting UI flags to this shape.
 */
export interface AppState {
  sidebarCollapsed: boolean;
}

/**
 * Typed accessors for the global App state (Requirement 8.2):
 * - `state` exposes the current client state for reading.
 * - `setSidebarCollapsed` updates the sidebar collapse flag.
 */
export interface AppStateContextValue {
  state: AppState;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const INITIAL_STATE: AppState = {
  sidebarCollapsed: false,
};

// Raw context is intentionally not exported — consumers use `useAppState`.
const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) =>
      prev.sidebarCollapsed === collapsed
        ? prev
        : { ...prev, sidebarCollapsed: collapsed },
    );
  }, []);

  // Memoize the context value so subscribers only re-render when the state
  // or the stable updater identity actually changes.
  const value = useMemo<AppStateContextValue>(
    () => ({ state, setSidebarCollapsed }),
    [state, setSidebarCollapsed],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === null) {
    throw new Error(
      "useAppState must be used within an <AppStateProvider>. " +
        "Wrap a parent component (typically in App.tsx) with <AppStateProvider>.",
    );
  }
  return context;
}
