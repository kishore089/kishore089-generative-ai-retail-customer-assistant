import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { queryClient } from "@/config/queryClient";
import { AppStateProvider } from "@/contexts/AppStateContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { router } from "@/routes";

/**
 * Root application component (design "Provider Composition").
 *
 * Composes the global providers from outermost to innermost so each inner
 * layer can depend on the ones above it:
 *   ThemeProvider          — theme mode + `.dark` class (Req 3.1, 4.x)
 *   QueryClientProvider    — shared React Query server-state cache (Req 9.1)
 *   AuthProvider           — placeholder auth + HTTP auth bridge (Req 6.1)
 *   CustomerProvider       — active-customer + selection context (Req 5.2)
 *   AppStateProvider       — client-only global UI state (Req 8.1)
 *   RouterProvider         — route tree / navigation (Req 1.4, 5.x)
 */
export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomerProvider>
            <AppStateProvider>
              <RouterProvider router={router} />
            </AppStateProvider>
          </CustomerProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
