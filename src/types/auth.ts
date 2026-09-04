import type { Role, Credentials } from "@/types/user";
import type { Customer } from "@/types/customer";

/** Re-export for consumer convenience so callers can import from `@/types/auth`. */
export type { Credentials } from "@/types/user";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Cognito session status, tracked independently of the app-level `AuthStatus`.
 *
 * A detected Cognito session does NOT by itself make the app "authenticated":
 * the customer must still complete the Customer-ID second step. This dimension
 * only reflects whether Amplify currently has a valid Cognito session.
 */
export type CognitoStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  displayName: string;
  email?: string;
  /** Active role for the authenticated user. */
  role: Role;
  /** Associated customer id; `null` when `role === "Admin"`. */
  customerId: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Typed accessor for the active role; `null` while unauthenticated. */
  role: Role | null;
  getToken: () => string | null;
  /** Establish an authenticated Customer session from an already-fetched customer. */
  signInCustomer: (customer: Customer) => Promise<void>;
  /** Establish an authenticated Admin session from admin credentials. */
  signInAdmin: (credentials: AdminCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // --- Cognito dimension (extends the existing customer/admin flows) ---------
  /** Amplify Cognito session status, independent of app-level `status`. */
  cognitoStatus: CognitoStatus;
  /** Email of the authenticated Cognito user, or `null` when unauthenticated. */
  cognitoEmail: string | null;
  /** Authenticate with Cognito (email + password); returns whether sign-in completed. */
  cognitoSignIn: (email: string, password: string) => Promise<boolean>;
  /** Register a new Cognito account; returns whether email confirmation is required. */
  cognitoSignUp: (email: string, password: string) => Promise<boolean>;
  /** Confirm a new Cognito account with the emailed code. */
  cognitoConfirmSignUp: (email: string, code: string) => Promise<void>;
  /** Resend the sign-up confirmation code. */
  cognitoResendSignUpCode: (email: string) => Promise<void>;
  /** Begin a Cognito password reset (sends a code to the user's email). */
  cognitoResetPassword: (email: string) => Promise<void>;
  /** Complete a Cognito password reset with the emailed code and a new password. */
  cognitoConfirmResetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
}

/** Credentials submitted on the admin login form. */
export interface AdminCredentials {
  username: string;
  password: string;
}

/**
 * Authentication service contract (evolved from the Phase 1 `AuthClient`).
 * A Cognito-backed implementation can replace the mock without changing
 * any consumer.
 */
export interface AuthService {
  getSession(): Promise<AuthUser | null>;
  /** Throws an `AuthError` on invalid credentials. */
  signIn(credentials: Credentials): Promise<AuthUser>;
  signOut(): Promise<void>;
  getToken(): string | null;
}

/**
 * Backward-compatible alias. Phase 1 code (AuthContext, authBridge) still
 * imports `AuthClient`; later Phase 2 tasks migrate these to `AuthService`.
 */
export type AuthClient = AuthService;
