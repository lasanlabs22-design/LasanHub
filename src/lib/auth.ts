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
  switch (err?.code) {
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
    default:
      devLog("Auth error:", err?.code, err?.message);
      return new AuthError("Something went wrong. Please try again.");
  }
}

export type Confirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

export async function sendOtp(phone: string): Promise<Confirmation> {
  const digits = phone.replace(/\D/g, "").slice(-10);

  if (digits.length !== 10) {
    throw new AuthError("Enter a valid 10-digit mobile number.");
  }

  try {
    return await signInWithPhoneNumber(getAuth(), `+91${digits}`);
  } catch (err) {
    throw readable(err);
  }
}

export async function verifyOtp(confirmation: Confirmation, code: string) {
  const digits = code.replace(/\D/g, "");

  if (digits.length !== 6) {
    throw new AuthError("Enter the 6-digit code.");
  }

  try {
    await confirmation.confirm(digits);
  } catch (err) {
    throw readable(err);
  }
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
