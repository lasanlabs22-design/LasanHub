import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasVerifiedPhone,
  verifiedPhone,
  signOutEverything,
  watchAuth,
} from "../lib/auth";
import {
  fetchMyProfile,
  setUnauthorizedHandler,
  CreatorProfile,
} from "../api/client";

const KEYS = {
  prefill: "@lasanhub/prefill",
};

/** Name and email from Google, held until the profile form uses them */
export type Prefill = { name: string; email: string; photo: string | null };

/**
 * Whether we know if this person has a profile.
 * "failed" matters: without it, a partner who opens the app offline
 * looks exactly like someone who has never signed up.
 */
export type ProfileState = "unknown" | "loaded" | "failed";

/** What a profile lookup found — or that it couldn't find out */
export type ProfileResult =
  | { ok: true; profile: CreatorProfile | null }
  | { ok: false };

type AuthContextType = {
  /** False until we've checked the device and the server */
  isReady: boolean;
  /** Has this device verified a phone number? */
  isSignedIn: boolean;
  phone: string | null;
  /** Their partner profile, or null if they haven't made one */
  profile: CreatorProfile | null;
  profileState: ProfileState;
  prefill: Prefill | null;

  setPrefill: (p: Prefill | null) => void;
  refreshProfile: () => Promise<ProfileResult>;
  /** Picks up the session straight after a successful OTP */
  markSignedIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [profileState, setProfileState] = useState<ProfileState>("unknown");
  const [prefill, setPrefillState] = useState<Prefill | null>(null);

  const setPrefill = useCallback((p: Prefill | null) => {
    setPrefillState(p);
    const write = p
      ? AsyncStorage.setItem(KEYS.prefill, JSON.stringify(p))
      : AsyncStorage.removeItem(KEYS.prefill);
    write.catch(() => {});
  }, []);

  const clearSession = useCallback(() => {
    setIsSignedIn(false);
    setPhone(null);
    setProfile(null);
    setProfileState("unknown");
    setPrefill(null);
  }, [setPrefill]);

  /* Read inside refreshProfile without making it change identity */
  const profileRef = useRef<CreatorProfile | null>(null);
  profileRef.current = profile;

  /** Ask the server what we know about this partner */
  const refreshProfile = useCallback(async (): Promise<ProfileResult> => {
    if (!hasVerifiedPhone()) {
      setProfile(null);
      setProfileState("loaded");
      return { ok: true, profile: null };
    }

    try {
      const p = await fetchMyProfile();
      setProfile(p);
      setProfileState("loaded");
      return { ok: true, profile: p };
    } catch {
      // Keep whatever we had. Only flag it when we have nothing, so a
      // blip on a later refresh doesn't disturb a working screen.
      if (!profileRef.current) setProfileState("failed");
      return { ok: false };
    }
  }, []);

  /* On launch: read the device, then let Firebase tell us who's signed in */
  const booted = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEYS.prefill)
      .then((stored) => {
        if (stored) setPrefillState(JSON.parse(stored));
      })
      .catch(() => {});

    const unsubscribe = watchAuth(async (hasPhone) => {
      setIsSignedIn(hasPhone);
      setPhone(verifiedPhone());

      if (!booted.current) {
        booted.current = true;
        if (hasPhone) await refreshProfile();
        else setProfileState("loaded");
        setIsReady(true);
        return;
      }

      // Signed out somewhere else — Firebase revoked or disabled the user
      if (!hasPhone) {
        setProfile(null);
        setProfileState("unknown");
      }
    });

    return unsubscribe;
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await signOutEverything();
    clearSession();
  }, [clearSession]);

  /* The server refused a fresh token: this session is over */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const markSignedIn = useCallback(() => {
    setIsSignedIn(hasVerifiedPhone());
    setPhone(verifiedPhone());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isReady,
        isSignedIn,
        phone,
        profile,
        profileState,
        prefill,
        setPrefill,
        refreshProfile,
        markSignedIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
