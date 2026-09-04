import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar, TopNavbar } from "@/components/layout";
import { ErrorBoundary, Loading } from "@/components/common";
import { useAppState } from "@/contexts/AppStateContext";
import { useIsMobile } from "@/hooks";

/**
 * Application shell layout (Requirements 5.3, 12.1, 16.1, 16.2).
 *
 * Renders the persistent chrome — collapsible {@link Sidebar} and
 * {@link TopNavbar} — around the routed page content. Route content is
 * rendered via {@link Outlet} inside an {@link ErrorBoundary} + {@link Suspense}
 * so lazy-loaded pages show a loading fallback and render errors are contained
 * to the content area without tearing down the shell.
 *
 * Sidebar collapse is controlled solely by the global {@link useAppState} flag,
 * toggled from either the sidebar's own control or the navbar menu button.
 */
export function AppLayout() {
  const { state, setSidebarCollapsed } = useAppState();
  // `useIsMobile` is observed here so the shell participates in responsive
  // re-renders; collapse itself stays user-driven to avoid layout surprises.
  const isMobile = useIsMobile();
  void isMobile;

  const collapsed = state.sidebarCollapsed;
  const toggle = () => setSidebarCollapsed(!collapsed);

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar onMenuClick={toggle} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-7xl">
            <ErrorBoundary>
              <Suspense fallback={<Loading label="Loading…" />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
