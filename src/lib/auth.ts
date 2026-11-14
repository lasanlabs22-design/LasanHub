import {
  getAuth,
  signInWithPhoneNumber,
  signOut,
  getIdToken,
  onAuthStateChanged,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../config";
import { devLog } from "./log";

export function configureGoogle() {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

export class AuthError extends Error {
  cancelled: boolean;

  constructor(message: string, cancelled = false) {
    super(message);
    this.name = "AuthError";
    this.cancelled = cancelled;
  }
}

/* ---------------- Phone ---------------- */

function readable(err: any): AuthError {
  const code: string = err?.code || "unknown";

  switch (code) {
    case "auth/invalid-phone-number":
      return new AuthError("That number doesn't look right.");
    case "auth/too-many-requests":
      return new AuthError("Too many attempts. Please try again later.");
    case "auth/invalid-verification-code":
      return new AuthError("That code is incorrect.");
    case "auth/code-expired":
    case "auth/session-expired":
      return new AuthError("That code expired. Request a new one.");
    case "auth/network-request-failed":
      return new AuthError("Check your connection and try again.");
    case "auth/quota-exceeded":
      return new AuthError(
        "We can't send codes right now. Please try again in a little while.",
      );
    case "auth/web-context-cancelled":
      return new AuthError("The check was closed before it finished. Please try again.");
    default:
      devLog("Auth error:", code, err?.message);
      // The code alone says nothing about the user, and it turns a
      // partner's screenshot into something we can actually act on
      return new AuthError(`Something went wrong (${code}). Please try again.`);
  }
}

type FirebaseConfirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

/**
 * What `sendOtp` hands back — pass it to `verifyOtp`.
 *
 * On Android a typed code isn't the only way in: Play services can
 * verify the number on the phone itself (no SMS at all) or read the
 * SMS before the partner does, and sign in on its own. `result` is
 * null when that happened before any code was sent.
 */
export type Confirmation = {
  phoneNumber: string;
  result: FirebaseConfirmation | null;
};

/** Is Firebase already signed in as this exact number? */
function signedInAs(phoneNumber: string): boolean {
  return getAuth().currentUser?.phoneNumber === phoneNumber;
}

/**
 * Pass `resend` for "Send a new code": Android quietly drops a repeat
 * request for the same number unless it's flagged as a resend.
 */
export async function sendOtp(
  phone: string,
  resend = false,
): Promise<Confirmation> {
  const digits = phone.replace(/\D/g, "").slice(-10);

  if (digits.length !== 10) {
    throw new AuthError("Enter a valid 10-digit mobile number.");
  }

  const phoneNumber = `+91${digits}`;

  try {
    // The modular signInWithPhoneNumber has no resend flag, but the
    // auth instance's own method does
    const result: FirebaseConfirmation = resend
      ? await (getAuth() as any).signInWithPhoneNumber(phoneNumber, true)
      : await signInWithPhoneNumber(getAuth(), phoneNumber);

    return { phoneNumber, result };
  } catch (err: any) {
    // Instant verification signs in without sending any code, which the
    // library reports as a missing verification ID. The sign-in itself
    // can land a moment after that — `onPhoneVerified` picks it up.
    const instant =
      !err?.code && String(err?.message ?? "").includes("verificationId");

    if (instant || signedInAs(phoneNumber)) {
      return { phoneNumber, result: null };
    }

    throw readable(err);
  }
}

export async function verifyOtp(confirmation: Confirmation, code: string) {
  const digits = code.replace(/\D/g, "");

  if (digits.length !== 6) {
    throw new AuthError("Enter the 6-digit code.");
  }

  // Android already read the SMS and signed in. That uses the code up,
  // so confirming it now would fail as "expired".
  if (signedInAs(confirmation.phoneNumber)) return;

  if (!confirmation.result) {
    throw new AuthError("That code expired. Request a new one.");
  }

  try {
    await confirmation.result.confirm(digits);
  } catch (err) {
    // ...or it did so while this was in flight
    if (signedInAs(confirmation.phoneNumber)) return;

    throw readable(err);
  }
}

/**
 * Calls back once Firebase is signed in as the number the code went
 * to — including when Android verifies it without the partner typing
 * anything. Fires straight away if that has already happened.
 */
export function onPhoneVerified(
  confirmation: Confirmation,
  callback: () => void,
) {
  return onAuthStateChanged(getAuth(), () => {
    if (signedInAs(confirmation.phoneNumber)) callback();
  });
}

/* ---------------- Google ---------------- */

/** Only fills in the form — the verified phone number is the real sign-in */
export async function signInWithGoogle(): Promise<{
  name: string;
  email: string;
  photo: string | null;
}> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const result = await GoogleSignin.signIn();
    const user = (result as any)?.data?.user ?? (result as any)?.user;

    // Closing the account picker comes back as an empty result, not an error
    if ((result as any)?.type === "cancelled") {
      throw new AuthError("Cancelled", true);
    }

    if (!user?.email) {
      throw new AuthError("Could not read your Google account.");
    }

    return {
      name: user.name || user.givenName || "",
      email: user.email,
      photo: user.photo || null,
    };
  } catch (err: any) {
    if (err instanceof AuthError) throw err;

    devLog("Google sign-in error:", err?.code, err?.message);

    switch (err?.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        throw new AuthError("Cancelled", true);
      case statusCodes.IN_PROGRESS:
        throw new AuthError("Already signing in — one moment.");
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        throw new AuthError(
          "Google sign-in needs Google Play services. You can fill the form in yourself.",
        );
      default:
        throw new AuthError(
          "Google sign-in didn't work. You can fill the form in yourself.",
        );
    }
  }
}

/* ---------------- Shared ---------------- */

/**
 * Attached to every API call, so the backend knows who is asking.
 * `forceRefresh` asks Firebase for a brand-new token — used once when
 * the server says the current one is no good.
 */
export async function getAuthToken(
  forceRefresh = false,
): Promise<string | null> {
  try {
    const user = getAuth().currentUser;
    if (!user) return null;
    return await getIdToken(user, forceRefresh);
  } catch {
    return null;
  }
}

export function hasVerifiedPhone(): boolean {
  return !!getAuth().currentUser?.phoneNumber;
}

export function verifiedPhone(): string | null {
  const raw = getAuth().currentUser?.phoneNumber;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/** Fires now with the current user, then on every sign-in or sign-out */
export function watchAuth(listener: (hasPhone: boolean) => void) {
  return onAuthStateChanged(getAuth(), (user) =>
    listener(!!user?.phoneNumber),
  );
}

export async function signOutEverything() {
  try {
    await GoogleSignin.signOut();
  } catch {}
  try {
    await signOut(getAuth());
  } catch {}
}
