/**
 * Cognito authentication wrapper (thin, typed, React-free).
 *
 * Wraps the Amplify v6 `aws-amplify/auth` APIs behind small async functions
 * that return normalized results and throw `Error`s carrying user-friendly
 * messages. Amplify error `name`/`message` values are mapped to friendly text
 * via {@link toCognitoErrorMessage}. Tokens and passwords are NEVER included in
 * returned data, thrown messages, or logs.
 *
 * This module is intentionally free of React so it can be reused and tested in
 * isolation; the `AuthContext` provider consumes it.
 */

import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import type { SignInOutput, SignUpOutput } from "aws-amplify/auth";

/** Normalized result of a sign-in attempt. */
export interface CognitoSignInResult {
  isSignedIn: boolean;
  nextStep: SignInOutput["nextStep"];
}

/** Normalized result of a sign-up attempt. */
export interface CognitoSignUpResult {
  isSignUpComplete: boolean;
  /** True when the user must confirm their email with a code before signing in. */
  confirmationRequired: boolean;
  nextStep: SignUpOutput["nextStep"];
}

/** Normalized result of a confirm-sign-up attempt. */
export interface CognitoConfirmSignUpResult {
  isSignUpComplete: boolean;
}

/** Minimal, non-sensitive view of the current Cognito user. */
export interface CognitoUser {
  username: string;
  userId: string;
}

/**
 * Maps an unknown thrown value (typically an Amplify `AuthError`) to a concise,
 * user-friendly message. Never returns tokens or passwords — Amplify error
 * messages do not carry the submitted password, and this mapper does not echo
 * any credential input.
 */
export function toCognitoErrorMessage(error: unknown): string {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  switch (name) {
    case "NotAuthorizedException":
      return "Incorrect email or password. Please try again.";
    case "UserNotFoundException":
      return "We couldn't find an account with that email address.";
    case "UserNotConfirmedException":
      return "Your account isn't confirmed yet. Enter the confirmation code sent to your email.";
    case "UsernameExistsException":
      return "An account with that email already exists. Try signing in instead.";
    case "CodeMismatchException":
      return "That confirmation code is incorrect. Please check it and try again.";
    case "ExpiredCodeException":
      return "That code has expired. Please request a new one.";
    case "InvalidPasswordException":
      return "That password doesn't meet the requirements. Please choose a stronger password.";
    case "InvalidParameterException":
      return "Some of the information entered is invalid. Please review and try again.";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "Too many attempts. Please wait a moment and try again.";
    case "CodeDeliveryFailureException":
      return "We couldn't deliver the confirmation code. Please try again.";
    case "PasswordResetRequiredException":
      return "You need to reset your password before signing in. Use \u201CForgot password?\u201D to continue.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Sign a customer in with email + password. Throws a friendly `Error` on failure. */
export async function cognitoSignIn(
  email: string,
  password: string,
): Promise<CognitoSignInResult> {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });
    return { isSignedIn, nextStep };
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Register a new customer account. Throws a friendly `Error` on failure. */
export async function cognitoSignUp(
  email: string,
  password: string,
): Promise<CognitoSignUpResult> {
  try {
    const { isSignUpComplete, nextStep } = await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
    return {
      isSignUpComplete,
      confirmationRequired: nextStep.signUpStep === "CONFIRM_SIGN_UP",
      nextStep,
    };
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Confirm a new account with the emailed code. Throws a friendly `Error` on failure. */
export async function cognitoConfirmSignUp(
  email: string,
  code: string,
): Promise<CognitoConfirmSignUpResult> {
  try {
    const { isSignUpComplete } = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    return { isSignUpComplete };
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Resend the sign-up confirmation code. Throws a friendly `Error` on failure. */
export async function cognitoResendSignUpCode(email: string): Promise<void> {
  try {
    await resendSignUpCode({ username: email });
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Start a password reset (sends a code). Throws a friendly `Error` on failure. */
export async function cognitoResetPassword(email: string): Promise<void> {
  try {
    await resetPassword({ username: email });
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Complete a password reset with the emailed code. Throws a friendly `Error` on failure. */
export async function cognitoConfirmResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/** Sign the current Cognito user out. Throws a friendly `Error` on failure. */
export async function cognitoSignOut(): Promise<void> {
  try {
    await signOut();
  } catch (error) {
    throw new Error(toCognitoErrorMessage(error), { cause: error });
  }
}

/**
 * Return the current authenticated Cognito user, or `null` when there is no
 * active session. The "no current user" case is expected (not an error) and is
 * NOT logged.
 */
export async function getCurrentCognitoUser(): Promise<CognitoUser | null> {
  try {
    const { username, userId } = await getCurrentUser();
    return { username, userId };
  } catch {
    // No authenticated user — this is a normal, expected state on a fresh app
    // load. Intentionally swallowed without logging.
    return null;
  }
}

/**
 * Return the authenticated Cognito user's verified email address, or `null`
 * when unavailable. Uses `fetchUserAttributes()` so it is correct regardless of
 * whether the pool's username is the email or an opaque id. Never logs the
 * value.
 */
export async function getCognitoUserEmail(): Promise<string | null> {
  try {
    const attributes = await fetchUserAttributes();
    return attributes.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Return the current Cognito access token as a string, or `null` when there is
 * no active session. The token is never logged. Intended for the HTTP auth
 * bridge so future authenticated API calls can attach it.
 */
export async function getCognitoAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}
