import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, type } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import {
  sendOtp,
  verifyOtp,
  signInWithGoogle,
  Confirmation,
  AuthError,
} from "../lib/auth";
import Button from "../components/Button";

const RESEND_SECONDS = 45;

export default function AuthScreen() {
  const { markSignedIn, refreshProfile, setPrefill } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  const codeInput = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (step === "code") {
      const t = setTimeout(() => codeInput.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleSend = async (resend = false) => {
    if (phone.length !== 10 || busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await sendOtp(phone);
      setConfirmation(result);
      setSeconds(RESEND_SECONDS);
      if (!resend) {
        setStep("code");
        setCode("");
      }
    } catch (err: any) {
      setError(err?.message || "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !confirmation || busy) return;

    Keyboard.dismiss();
    setBusy(true);
    setError("");

    try {
      await verifyOtp(confirmation, code);
      markSignedIn();
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || "That code did not work.");
      setCode("");
      codeInput.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  /**
   * Google gives us a name and email but never a phone number,
   * so we hold those and still ask for the number.
   */
  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    setError("");

    try {
      const user = await signInWithGoogle();
      setPrefill({ name: user.name, email: user.email, photo: user.photo });
    } catch (err: any) {
      if (!err?.cancelled) {
        setError(err?.message || "Could not sign in with Google.");
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.ink, colors.inkSoft, colors.ink]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glow} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.body}>
            {step === "phone" ? (
              <>
                <View style={styles.mark}>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={26}
                    color={colors.white}
                  />
                </View>

                <Text style={styles.brand}>LASAN HUB</Text>

                <Text style={styles.title}>
                  Get discovered by{"\n"}local businesses
                </Text>

                <Text style={styles.subtitle}>
                  Join our verified creator network. Businesses across Andhra
                  Pradesh find you here.
                </Text>

                <View style={styles.spacer} />

                <Text style={styles.fieldLabel}>Mobile number</Text>
                <View style={styles.phoneBox}>
                  <Text style={styles.code}>+91</Text>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t.replace(/[^0-9]/g, ""));
                      setError("");
                    }}
                    autoFocus
                    editable={!busy}
                  />
                  {phone.length === 10 && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={19}
                      color={colors.success}
                    />
                  )}
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  label="Continue"
                  onPress={() => handleSend()}
                  disabled={phone.length !== 10}
                  busy={busy}
                  style={{ marginTop: 22 }}
                />

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  activeOpacity={0.85}
                  onPress={handleGoogle}
                  disabled={googleBusy}
                >
                  <MaterialCommunityIcons
                    name="google"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.googleText}>
                    {googleBusy ? "Signing in…" : "Continue with Google"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.legal}>
                  We'll verify your number either way
                </Text>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.back}
                  onPress={() => {
                    setStep("phone");
                    setCode("");
                    setError("");
                  }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>

                <Text style={styles.title}>Enter the code</Text>
                <Text style={styles.subtitle}>Sent to +91 {phone}</Text>

                <View style={styles.spacer} />

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => codeInput.current?.focus()}
                  style={styles.boxRow}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.codeBox,
                        code[i] ? styles.codeBoxFilled : null,
                        i === code.length ? styles.codeBoxActive : null,
                      ]}
                    >
                      <Text style={styles.codeText}>{code[i] || ""}</Text>
                    </View>
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={codeInput}
                  style={styles.hidden}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t.replace(/[^0-9]/g, ""));
                    setError("");
                  }}
                  caretHidden
                  editable={!busy}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  label="Verify"
                  onPress={handleVerify}
                  disabled={code.length !== 6}
                  busy={busy}
                  style={{ marginTop: 24 }}
                />

                {seconds > 0 ? (
                  <Text style={styles.resendWait}>Resend in {seconds}s</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resend}
                    onPress={() => handleSend(true)}
                  >
                    <Text style={styles.resendText}>Send a new code</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  glow: {
    position: "absolute",
    top: "-10%",
    alignSelf: "center",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.primary,
    opacity: 0.28,
  },

  body: { flex: 1, paddingHorizontal: 26, paddingTop: 40 },

  mark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.white,
    letterSpacing: -0.9,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.5)",
    marginTop: 12,
  },

  spacer: { flex: 1, minHeight: 30 },

  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 9,
  },
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
  },
  code: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  phoneInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.white,
    letterSpacing: 1.2,
    padding: 0,
  },

  boxRow: { flexDirection: "row", gap: 9 },
  codeBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxFilled: {
    borderColor: colors.primaryLight,
    backgroundColor: "rgba(123,63,196,0.18)",
  },
  codeBoxActive: { borderColor: colors.primaryLight },
  codeText: { fontFamily: fonts.bold, fontSize: 22, color: colors.white },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },

  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#FF8080",
    marginTop: 14,
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  orText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.35)",
  },

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.16)",
  },
  googleText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.white,
  },

  legal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 10,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resendWait: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  resend: { alignItems: "center", paddingVertical: 18, marginBottom: 6 },
  resendText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryLight,
  },
});
