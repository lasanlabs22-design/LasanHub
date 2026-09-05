import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasVerifiedPhone,
  verifiedPhone,
  signOutEverything,
} from "../lib/auth";
import { fetchMyProfile, CreatorProfile } from "../api/client";

const KEYS = {
  seenIntro: "@lasanhub/seenIntro",
  prefill: "@lasanhub/prefill",
};

/** Name and email from Google, held until the profile form uses them */
type Prefill = { name: string; email: string; photo: string | null };

type AuthContextType = {
  /** False until we've checked the device and the server */
  isReady: boolean;
  /** Has this device verified a phone number? */
  isSignedIn: boolean;
  phone: string | null;
  /** Their creator profile, or null if they haven't made one */
  profile: CreatorProfile | null;
  prefill: Prefill | null;

  setPrefill: (p: Prefill | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [prefill, setPrefillState] = useState<Prefill | null>(null);

  const setPrefill = (p: Prefill | null) => {
    setPrefillState(p);
    if (p) {
      AsyncStorage.setItem(KEYS.prefill, JSON.stringify(p)).catch(() => {});
    } else {
      AsyncStorage.removeItem(KEYS.prefill).catch(() => {});
    }
  };

  /** Ask the server what we know about this creator */
  const refreshProfile = useCallback(async () => {
    if (!hasVerifiedPhone()) {
      setProfile(null);
      return;
    }

    try {
      const p = await fetchMyProfile();
      setProfile(p);
    } catch {
      // Leave whatever we had; the screen can retry
    }
  }, []);

  /* On launch: read the device, then check the server */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEYS.prefill);
        if (stored) setPrefillState(JSON.parse(stored));
      } catch {}

      const signedIn = hasVerifiedPhone();
      setIsSignedIn(signedIn);
      setPhone(verifiedPhone());

      if (signedIn) {
        await refreshProfile();
      }

      setIsReady(true);
    })();
  }, [refreshProfile]);

  const signOut = async () => {
    await signOutEverything();
    setIsSignedIn(false);
    setPhone(null);
    setProfile(null);
    setPrefill(null);
  };

  /** Called after a successful OTP, to pick up the new session */
  const markSignedIn = () => {
    setIsSignedIn(hasVerifiedPhone());
    setPhone(verifiedPhone());
  };

  return (
    <AuthContext.Provider
      value={{
        isReady,
        isSignedIn,
        phone,
        profile,
        prefill,
        setPrefill,
        refreshProfile,
        signOut,
        // @ts-expect-error — used by the auth screen only
        markSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx as AuthContextType & { markSignedIn: () => void };
}
