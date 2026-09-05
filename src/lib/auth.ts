import {
  getAuth,
  signInWithPhoneNumber,
  signOut,
  getIdToken,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

/** Same web client ID as Lasan Mart — one Firebase project */
const WEB_CLIENT_ID =
  "619769435695-1af73d9j24u4mvjqtn8rqcupm7jlmhoo.apps.googleusercontent.com";

export function configureGoogle() {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
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
      console.log("Auth error:", err?.code, err?.message);
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
  if (code.replace(/\D/g, "").length !== 6) {
    throw new AuthError("Enter the 6-digit code.");
  }

  try {
    await confirmation.confirm(code.replace(/\D/g, ""));
  } catch (err) {
    throw readable(err);
  }
}

/* ---------------- Google ---------------- */

export async function signInWithGoogle(): Promise<{
  name: string;
  email: string;
  photo: string | null;
}> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const result = await GoogleSignin.signIn();
    const user = (result as any)?.data?.user ?? (result as any)?.user;

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

    console.log("GOOGLE ERROR:", err?.code, err?.message);

    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new AuthError("Cancelled", true);
    }

    throw new AuthError(`${err?.code || "no-code"} — ${err?.message || ""}`);
  }
}

/* ---------------- Shared ---------------- */

/** Attached to every API call, so the backend knows who is asking */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = getAuth().currentUser;
    if (!user) return null;
    return await getIdToken(user);
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

export async function signOutEverything() {
  try {
    await GoogleSignin.signOut();
  } catch {}
  try {
    await signOut(getAuth());
  } catch {}
}
