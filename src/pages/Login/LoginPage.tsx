import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "@heroui/react";

import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { customerService } from "@/services/customers";
import { getCognitoUserEmail } from "@/services/auth";
import { Loading } from "@/components/common";
import { PATHS } from "@/routes/paths";

/**
 * Shape of the router location state we optionally read to restore the
 * originally requested route after a successful sign-in (set by the route
 * guard when redirecting an unauthenticated user here).
 */
interface LocationState {
  from?: string;
}

/** The two sign-in modes surfaced by the segmented toggle. */
type LoginMode = "customer" | "admin";

/**
 * Sub-views within the Customer tab. The customer flow authenticates with
 * Cognito and then resolves the customer automatically by email — there is no
 * manual Customer-ID step. Auxiliary self-service views layer on top.
 */
type CustomerView =
  | "signIn"
  | "signUp"
  | "confirmSignUp"
  | "forgotRequest"
  | "forgotConfirm";

// Shared Tailwind class strings (identical to the original styling) reused
// across the customer sub-views so the design stays consistent.
const INPUT_CLASS =
  "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
const LABEL_CLASS = "block text-sm font-medium text-neutral-700";
const PRIMARY_BUTTON_CLASS =
  "flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const LINK_BUTTON_CLASS =
  "font-medium text-primary-600 transition-colors hover:text-primary-700 focus:outline-none focus:underline";

/** Extracts a friendly message from a thrown Cognito error. */
function cognitoMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Sign-in page.
 *
 * Customer mode: the customer authenticates with Cognito (email + password via
 * Amplify); on success the app automatically identifies the customer by the
 * authenticated email (`GET /customer?email=...`), populates the customer
 * context, establishes a customer session, and navigates to the dashboard. No
 * Customer-ID is ever requested. A persistent Cognito session detected on load
 * resolves the same way. If resolution fails, the user stays on the
 * email/password form with an inline error. "Create account", confirmation,
 * and "Forgot password?" sub-views wrap the Cognito self-service flows.
 *
 * Admin mode is unchanged: a username and password establish a mock admin
 * session, then navigate to the Admin Dashboard.
 */
export function LoginPage() {
  const {
    signInCustomer,
    signInAdmin,
    cognitoStatus,
    cognitoEmail,
    cognitoSignIn,
    cognitoSignUp,
    cognitoConfirmSignUp,
    cognitoResendSignUpCode,
    cognitoResetPassword,
    cognitoConfirmResetPassword,
  } = useAuth();
  const { setActiveCustomer } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<LoginMode>("customer");
  const [customerView, setCustomerView] = useState<CustomerView>("signIn");

  // Cognito sign-in state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Create-account state.
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Confirm-sign-up state (email carried from sign-up or sign-in).
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmCode, setConfirmCode] = useState("");

  // Forgot-password state.
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  // Shared Cognito sub-view feedback.
  const [cognitoError, setCognitoError] = useState<string | null>(null);
  const [cognitoInfo, setCognitoInfo] = useState<string | null>(null);
  const [cognitoSubmitting, setCognitoSubmitting] = useState(false);

  // Automatic customer-resolution state. While true, the customer tab shows a
  // dedicated loading panel and never renders any input form (so no stale
  // intermediate step can flash).
  const [resolving, setResolving] = useState(false);
  const resolveStartedRef = useRef(false);

  // Admin mode state.
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const from = (location.state as LocationState | null)?.from ?? null;

  const clearCognitoFeedback = () => {
    setCognitoError(null);
    setCognitoInfo(null);
  };

  const goToView = (next: CustomerView) => {
    clearCognitoFeedback();
    setCustomerView(next);
  };

  /**
   * Automatically identify the customer from the authenticated Cognito email
   * (`GET /customer?email=...`). On success, establishes the customer session
   * and navigates to the dashboard. On failure, stays on the email/password
   * form with an inline error. Guarded so it runs at most once per resolution
   * (shared by the sign-in handler and the startup session effect).
   */
  const autoResolveCustomer = useCallback(async () => {
    if (resolveStartedRef.current) return;
    resolveStartedRef.current = true;
    setResolving(true);
    setCognitoError(null);
    setCognitoInfo(null);
    try {
      const authEmail = (await getCognitoUserEmail()) ?? cognitoEmail;
      if (!authEmail) {
        setCognitoError(
          "Unable to determine the account email. Please sign in again.",
        );
        resolveStartedRef.current = false;
        setResolving(false);
        return;
      }
      const customer = await customerService.getByEmail(authEmail);
      if (customer) {
        setActiveCustomer(customer);
        await signInCustomer(customer);
        navigate(from ?? PATHS.dashboard, { replace: true });
        return;
      }
      setCognitoError(
        "We couldn't find a customer account associated with this email. Please check your email or contact support.",
      );
      resolveStartedRef.current = false;
      setResolving(false);
    } catch {
      setCognitoError(
        "Unable to load your customer profile. Please try again.",
      );
      resolveStartedRef.current = false;
      setResolving(false);
    }
  }, [cognitoEmail, from, navigate, setActiveCustomer, signInCustomer]);

  // Resolve automatically when a persistent Cognito session is detected on
  // startup (refresh). The guard in autoResolveCustomer prevents a duplicate
  // run when the sign-in handler already triggered resolution.
  useEffect(() => {
    if (cognitoStatus === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to async startup session detection
      void autoResolveCustomer();
    }
  }, [cognitoStatus, autoResolveCustomer]);

  const switchMode = (next: LoginMode) => {
    if (next === mode) return;
    setMode(next);
    // Clear the feedback belonging to the mode we are leaving.
    if (next === "admin") {
      clearCognitoFeedback();
    } else {
      setAdminError(null);
    }
  };

  // --- Cognito sign-in ------------------------------------------------------
  const handleCognitoSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!value || !password) {
      setCognitoError("Please enter your email and password.");
      return;
    }
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      const signedIn = await cognitoSignIn(value, password);
      setPassword("");
      if (signedIn) {
        // Automatically identify the customer from the authenticated email.
        await autoResolveCustomer();
      } else {
        // Sign-in returned a follow-up step (e.g. confirmation required).
        setConfirmEmail(value);
        setCustomerView("confirmSignUp");
        setCognitoInfo(
          "Please confirm your account with the code sent to your email.",
        );
      }
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "Unable to sign in. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  // --- Create account -------------------------------------------------------
  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = signupEmail.trim();
    if (!value || !signupPassword) {
      setCognitoError("Please enter an email and password.");
      return;
    }
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      const confirmationRequired = await cognitoSignUp(value, signupPassword);
      setSignupPassword("");
      if (confirmationRequired) {
        setConfirmEmail(value);
        setCustomerView("confirmSignUp");
        setCognitoInfo(
          "We sent a confirmation code to your email. Enter it below to finish.",
        );
      } else {
        setEmail(value);
        setCustomerView("signIn");
        setCognitoInfo("Account created. Please sign in.");
      }
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "Unable to create your account. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  // --- Confirm sign-up ------------------------------------------------------
  const handleConfirmSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmCode.trim()) {
      setCognitoError("Please enter the confirmation code.");
      return;
    }
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      await cognitoConfirmSignUp(confirmEmail, confirmCode.trim());
      setConfirmCode("");
      setEmail(confirmEmail);
      setCustomerView("signIn");
      setCognitoInfo("Your account is confirmed. Please sign in.");
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "That code didn't work. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      await cognitoResendSignUpCode(confirmEmail);
      setCognitoInfo("A new confirmation code is on its way to your email.");
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "Couldn't resend the code. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  // --- Forgot password ------------------------------------------------------
  const handleForgotRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = forgotEmail.trim();
    if (!value) {
      setCognitoError("Please enter your email address.");
      return;
    }
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      await cognitoResetPassword(value);
      setCustomerView("forgotConfirm");
      setCognitoInfo(
        "We sent a reset code to your email. Enter it below with your new password.",
      );
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "Couldn't start the reset. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  const handleForgotConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!forgotCode.trim() || !forgotNewPassword) {
      setCognitoError("Please enter the code and your new password.");
      return;
    }
    clearCognitoFeedback();
    setCognitoSubmitting(true);
    try {
      await cognitoConfirmResetPassword(
        forgotEmail.trim(),
        forgotCode.trim(),
        forgotNewPassword,
      );
      setForgotCode("");
      setForgotNewPassword("");
      setEmail(forgotEmail.trim());
      setCustomerView("signIn");
      setCognitoInfo("Your password was updated. Please sign in.");
    } catch (err) {
      setCognitoError(
        cognitoMessage(err, "Couldn't reset your password. Please try again."),
      );
    } finally {
      setCognitoSubmitting(false);
    }
  };

  // --- Admin (unchanged mock) -----------------------------------------------
  const handleAdminSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);
    try {
      setSubmitting(true);
      await signInAdmin({ username, password: adminPassword });
      navigate(PATHS.adminDashboard, { replace: true });
    } catch (e) {
      setAdminError(
        e instanceof Error ? e.message : "Invalid admin username or password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleButtonClasses = (active: boolean) =>
    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 " +
    (active
      ? "bg-white text-primary-700 shadow-sm"
      : "text-neutral-600 hover:text-neutral-900");

  // While a persistent session is being detected on load, or while resolving
  // the customer, show a loading panel for the customer tab (never a form).
  const showCustomerLoading = resolving || cognitoStatus === "loading";

  const subtitle =
    mode === "admin"
      ? "Sign in with your admin credentials."
      : showCustomerLoading
        ? "Signing you in…"
        : customerView === "signUp"
          ? "Create a new account to get started."
          : customerView === "confirmSignUp"
            ? "Confirm your account to continue."
            : customerView === "forgotRequest" ||
                customerView === "forgotConfirm"
              ? "Reset your password."
              : "Sign in with your email and password.";

  const feedback = (
    <>
      {cognitoError !== null && (
        <Alert status="danger">
          <Alert.Title>Something went wrong</Alert.Title>
          <Alert.Description>{cognitoError}</Alert.Description>
        </Alert>
      )}
      {cognitoInfo !== null && (
        <Alert status="success">
          <Alert.Description>{cognitoInfo}</Alert.Description>
        </Alert>
      )}
    </>
  );

  const renderCustomer = () => {
    if (showCustomerLoading) {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loading
            size="sm"
            label={resolving ? "Identifying your account…" : "Loading…"}
          />
        </div>
      );
    }

    switch (customerView) {
      case "signUp":
        return (
          <form className="space-y-5" onSubmit={handleSignUp}>
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-password" className={LABEL_CLASS}>
                Password
              </label>
              <input
                id="signup-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>

            {feedback}

            <button
              type="submit"
              disabled={cognitoSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              Create account
            </button>

            {cognitoSubmitting && (
              <Loading size="sm" label="Creating your account…" />
            )}

            <p className="text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={() => goToView("signIn")}
              >
                Sign in
              </button>
            </p>
          </form>
        );

      case "confirmSignUp":
        return (
          <form className="space-y-5" onSubmit={handleConfirmSignUp}>
            <p className="text-sm text-neutral-500">
              Enter the confirmation code sent to{" "}
              <span className="font-medium text-neutral-700">
                {confirmEmail}
              </span>
              .
            </p>
            <div className="space-y-1.5">
              <label htmlFor="confirm-code" className={LABEL_CLASS}>
                Confirmation code
              </label>
              <input
                id="confirm-code"
                name="confirm-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmCode}
                onChange={(event) => setConfirmCode(event.target.value)}
                placeholder="123456"
                className={INPUT_CLASS}
              />
            </div>

            {feedback}

            <button
              type="submit"
              disabled={cognitoSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              Confirm account
            </button>

            {cognitoSubmitting && <Loading size="sm" label="Confirming…" />}

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={handleResendCode}
                disabled={cognitoSubmitting}
              >
                Resend code
              </button>
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={() => goToView("signIn")}
              >
                Back to sign in
              </button>
            </div>
          </form>
        );

      case "forgotRequest":
        return (
          <form className="space-y-5" onSubmit={handleForgotRequest}>
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>

            {feedback}

            <button
              type="submit"
              disabled={cognitoSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              Send reset code
            </button>

            {cognitoSubmitting && <Loading size="sm" label="Sending code…" />}

            <p className="text-center text-sm text-neutral-500">
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={() => goToView("signIn")}
              >
                Back to sign in
              </button>
            </p>
          </form>
        );

      case "forgotConfirm":
        return (
          <form className="space-y-5" onSubmit={handleForgotConfirm}>
            <p className="text-sm text-neutral-500">
              Enter the reset code sent to{" "}
              <span className="font-medium text-neutral-700">
                {forgotEmail}
              </span>{" "}
              and choose a new password.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="forgot-code" className={LABEL_CLASS}>
                Reset code
              </label>
              <input
                id="forgot-code"
                name="forgot-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={forgotCode}
                onChange={(event) => setForgotCode(event.target.value)}
                placeholder="123456"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="forgot-new-password" className={LABEL_CLASS}>
                New password
              </label>
              <input
                id="forgot-new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={forgotNewPassword}
                onChange={(event) => setForgotNewPassword(event.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>

            {feedback}

            <button
              type="submit"
              disabled={cognitoSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              Update password
            </button>

            {cognitoSubmitting && (
              <Loading size="sm" label="Updating password…" />
            )}

            <p className="text-center text-sm text-neutral-500">
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={() => goToView("signIn")}
              >
                Back to sign in
              </button>
            </p>
          </form>
        );

      case "signIn":
      default:
        return (
          <form className="space-y-5" onSubmit={handleCognitoSignIn}>
            <div className="space-y-1.5">
              <label htmlFor="customer-email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="customer-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="customer-password" className={LABEL_CLASS}>
                  Password
                </label>
                <button
                  type="button"
                  className={LINK_BUTTON_CLASS + " text-xs"}
                  onClick={() => goToView("forgotRequest")}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="customer-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>

            {feedback}

            <button
              type="submit"
              disabled={cognitoSubmitting}
              className={PRIMARY_BUTTON_CLASS}
            >
              Sign in
            </button>

            {cognitoSubmitting && <Loading size="sm" label="Signing in…" />}

            <p className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className={LINK_BUTTON_CLASS}
                onClick={() => goToView("signUp")}
              >
                Create account
              </button>
            </p>
          </form>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-lg font-semibold text-white">
              SC
            </div>
            <span className="text-sm font-medium tracking-wide text-neutral-500">
              Support Center
            </span>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
              Sign in to Support Center
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          </div>

          <div
            role="tablist"
            aria-label="Sign-in mode"
            className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "customer"}
              onClick={() => switchMode("customer")}
              className={toggleButtonClasses(mode === "customer")}
            >
              Customer Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "admin"}
              onClick={() => switchMode("admin")}
              className={toggleButtonClasses(mode === "admin")}
            >
              Admin Login
            </button>
          </div>

          {mode === "customer" ? (
            renderCustomer()
          ) : (
            <form className="space-y-5" onSubmit={handleAdminSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="admin-username" className={LABEL_CLASS}>
                  Username
                </label>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className={LABEL_CLASS}>
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="••••••••"
                  className={INPUT_CLASS}
                />
              </div>

              {adminError !== null && (
                <Alert status="danger">
                  <Alert.Title>Unable to sign in</Alert.Title>
                  <Alert.Description>{adminError}</Alert.Description>
                </Alert>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={PRIMARY_BUTTON_CLASS}
              >
                Sign in
              </button>

              {submitting && <Loading size="sm" label="Signing in…" />}

              <p className="text-center text-xs text-neutral-400">
                Demo admin — username: admin / password: admin123
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
