/* eslint-disable react-refresh/only-export-components --
 * This context module intentionally co-locates the AuthProvider component with
 * the useAuth hook. Splitting them would fragment the auth abstraction; Fast
 * Refresh is a dev-only concern that does not apply to these stable exports. */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AdminCredentials,
  AuthContextValue,
  AuthStatus,
  AuthUser,
  CognitoStatus,
} from "@/types/auth";
import type { Customer } from "@/types/customer";
import {
  clearSession,
  cognitoConfirmResetPassword as cognitoConfirmResetPasswordSvc,
  cognitoConfirmSignUp as cognitoConfirmSignUpSvc,
  cognitoResendSignUpCode as cognitoResendSignUpCodeSvc,
  cognitoResetPassword as cognitoResetPasswordSvc,
  cognitoSignIn as cognitoSignInSvc,
  cognitoSignOut as cognitoSignOutSvc,
  cognitoSignUp as cognitoSignUpSvc,
  getCognitoAccessToken,
  getCurrentCognitoUser,
} from "@/services/auth";
import { env } from "@/config/env";
import { setAuthBridge } from "@/utils/http/authBridge";

// Raw context is intentionally NOT exported — consumers use `useAuth`.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Mock admin credentials. Admin auth is intentionally a local mock (no backend
// admin identity provider yet); customer auth remains backed by the live API.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

/** Maps a domain `Customer` into the authenticated `AuthUser` shape. */
function toAuthUser(customer: Customer): AuthUser {
  return {
    id: customer.CustomerID,
    displayName: customer.Name,
    email: customer.Email,
    role: "Customer",
    customerId: customer.CustomerID,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");
  const [user, setUser] = useState<AuthUser | null>(null);

  // Cognito dimension — tracked independently of the app-level `status`. A
  // detected Cognito session never sets `status` to "authenticated" by itself;
  // the customer must still complete the Customer-ID second step, so
  // RoleRoute/customer-scoped gating is unchanged.
  const [cognitoStatus, setCognitoStatus] = useState<CognitoStatus>("loading");
  const [cognitoEmail, setCognitoEmail] = useState<string | null>(null);

  // Cached Cognito access token for the synchronous HTTP auth bridge. Refreshed
  // on startup detection and after a successful Cognito sign-in; cleared on
  // sign-out. Never logged or exposed to the UI.
  const cognitoTokenRef = useRef<string | null>(null);

  // Typed role accessor derived from the authenticated user (Requirement 1.3).
  const role = user?.role ?? null;

  // On mount, wipe any stale persisted session so a previously-stored customer
  // does not silently auto-authenticate. Login must be performed explicitly;
  // the app holds an in-memory session only.
  useEffect(() => {
    clearSession();
  }, []);

  // On mount, detect a persistent Cognito session (Amplify persists it across
  // reloads). This only sets the Cognito dimension; it does NOT set app-level
  // `status`. When auth-bypass is enabled we skip the Cognito network check so
  // bypass behavior is never blocked by a failed/absent Cognito session.
  useEffect(() => {
    if (env.authBypass) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external, one-shot startup sync
      setCognitoStatus("unauthenticated");
      return;
    }

    let cancelled = false;
    void (async () => {
      const currentUser = await getCurrentCognitoUser();
      if (cancelled) return;
      if (currentUser) {
        cognitoTokenRef.current = await getCognitoAccessToken();
        if (cancelled) return;
        setCognitoEmail(currentUser.username);
        setCognitoStatus("authenticated");
      } else {
        cognitoTokenRef.current = null;
        setCognitoEmail(null);
        setCognitoStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Wire the HTTP auth bridge so the shared HTTP client can read the current
  // token and trigger sign-out on 401/403 without importing this context.
  // Cleared on unmount.
  useEffect(() => {
    setAuthBridge({
      // Reads the cached Cognito access token synchronously. Never logged.
      getToken: () => cognitoTokenRef.current,
      signOut: async () => {
        // Best-effort Cognito sign-out; app/session clear must proceed either
        // way so the user is never left in a half-signed-in state.
        try {
          await cognitoSignOutSvc();
        } catch {
          // Ignore — clearing the local session below is what gates the app.
        }
        cognitoTokenRef.current = null;
        clearSession();
        setUser(null);
        setStatus("unauthenticated");
        setCognitoEmail(null);
        setCognitoStatus("unauthenticated");
      },
    });
    return () => {
      setAuthBridge(null);
    };
  }, []);

  const getToken = useCallback(() => cognitoTokenRef.current, []);

  const signInCustomer = useCallback(async (customer: Customer) => {
    // In-memory session only: intentionally does not persist the session, so
    // the app does not auto-authenticate on the next startup.
    setUser(toAuthUser(customer));
    setStatus("authenticated");
  }, []);

  const signInAdmin = useCallback(
    async ({ username, password }: AdminCredentials) => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Admins have no associated customer; CustomerContext auto-load only
        // runs for role "Customer", so the active customer stays null until
        // the admin explicitly selects one.
        setUser({
          id: "admin",
          displayName: "Administrator",
          role: "Admin",
          customerId: null,
        });
        setStatus("authenticated");
        return;
      }
      throw new Error("Invalid admin username or password.");
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Sign out of Cognito in addition to clearing the app/session state. The
    // app clear proceeds regardless of Cognito outcome.
    try {
      await cognitoSignOutSvc();
    } catch {
      // Ignore — the local session clear below is what gates the app.
    }
    cognitoTokenRef.current = null;
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
    setCognitoEmail(null);
    setCognitoStatus("unauthenticated");
  }, []);

  // Retained to satisfy the AuthContextValue contract; no persisted restore.
  const refreshSession = useCallback(async () => {}, []);

  // --- Cognito-facing methods (email/password identity dimension) ------------

  const cognitoSignIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { isSignedIn } = await cognitoSignInSvc(email, password);
      if (isSignedIn) {
        cognitoTokenRef.current = await getCognitoAccessToken();
        setCognitoEmail(email);
        setCognitoStatus("authenticated");
      }
      return isSignedIn;
    },
    [],
  );

  const cognitoSignUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { confirmationRequired } = await cognitoSignUpSvc(email, password);
      return confirmationRequired;
    },
    [],
  );

  const cognitoConfirmSignUp = useCallback(
    async (email: string, code: string): Promise<void> => {
      await cognitoConfirmSignUpSvc(email, code);
    },
    [],
  );

  const cognitoResendSignUpCode = useCallback(
    async (email: string): Promise<void> => {
      await cognitoResendSignUpCodeSvc(email);
    },
    [],
  );

  const cognitoResetPassword = useCallback(
    async (email: string): Promise<void> => {
      await cognitoResetPasswordSvc(email);
    },
    [],
  );

  const cognitoConfirmResetPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<void> => {
      await cognitoConfirmResetPasswordSvc(email, code, newPassword);
    },
    [],
  );

  const value: AuthContextValue = {
    status,
    user,
    role,
    getToken,
    signInCustomer,
    signInAdmin,
    signOut,
    refreshSession,
    cognitoStatus,
    cognitoEmail,
    cognitoSignIn,
    cognitoSignUp,
    cognitoConfirmSignUp,
    cognitoResendSignUpCode,
    cognitoResetPassword,
    cognitoConfirmResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
