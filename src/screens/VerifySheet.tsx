import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size, TIGHT_SCALE } from "../theme/typography";
import { sendOtp, verifyOtp, Confirmation } from "../lib/auth";
import Button from "../components/Button";

const RESEND_SECONDS = 45;
const CODE_LENGTH = 6;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Fires once the number is verified — the caller then saves */
  onVerified: (phone: string) => void;
  /** Button label on the code step */
  verifyLabel?: string;
};

/**
 * Collects and verifies a phone number at the moment the partner
 * submits their profile. A full screen rather than a bottom sheet,
 * so the keyboard doesn't cover what they're typing.
 */
export default function VerifySheet({
  visible,
  onClose,
  onVerified,
  verifyLabel = "Verify & submit",
}: Props) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
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

  /* Start clean each time it opens */
  useEffect(() => {
    if (visible) {
      setStep("phone");
      setCode("");
      setError("");
      setConfirmation(null);
    }
  }, [visible]);

  const backToPhone = () => {
    setStep("phone");
    setCode("");
    setError("");
  };

  const send = async (resend = false) => {
    if (phone.length !== 10 || busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await sendOtp(phone);
      setConfirmation(result);
      setSeconds(RESEND_SECONDS);
      if (!resend) setStep("code");
    } catch (err: any) {
      setError(err?.message || "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.length !== CODE_LENGTH || !confirmation || busy) return;

    Keyboard.dismiss();
    setBusy(true);
    setError("");

    try {
      await verifyOtp(confirmation, code);
      onVerified(phone);
    } catch (err: any) {
      setError(err?.message || "That code did not work.");
      setCode("");
      codeInput.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    if (busy) return;
    if (step === "code") backToPhone();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={goBack}
    >
      {/* This screen is white even when opened from a dark one */}
      <StatusBar style="dark" />

      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.close}
              onPress={goBack}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={colors.textDark}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {step === "phone" ? (
              <>
                <View style={styles.icon}>
                  <MaterialCommunityIcons
                    name="cellphone-check"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.title} accessibilityRole="header">
                  Verify your number
                </Text>
                <Text style={styles.subtitle}>
                  This is how businesses and our team reach you. We'll text a
                  6-digit code.
                </Text>

                <View style={styles.phoneBox}>
                  <Text style={styles.code}>+91</Text>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    accessibilityLabel="Mobile number"
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

                {!!error && (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                )}

                <Button
                  label="Send code"
                  onPress={() => send()}
                  disabled={phone.length !== 10}
                  busy={busy}
                  style={{ marginTop: 22 }}
                />
              </>
            ) : (
              <>
                <View style={styles.icon}>
                  <MaterialCommunityIcons
                    name="message-text-lock-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.title} accessibilityRole="header">
                  Enter the code
                </Text>
                <Text style={styles.subtitle}>
                  Sent to +91 {phone}{" "}
                  <Text
                    style={styles.changeLink}
                    onPress={backToPhone}
                    accessibilityRole="link"
                  >
                    Change
                  </Text>
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => codeInput.current?.focus()}
                  style={styles.boxRow}
                  accessibilityLabel={`Verification code, ${code.length} of ${CODE_LENGTH} digits entered`}
                >
                  {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.codeBox,
                        code[i] ? styles.codeBoxFilled : null,
                        i === code.length ? styles.codeBoxActive : null,
                      ]}
                    >
                      <Text
                        style={styles.codeText}
                        maxFontSizeMultiplier={TIGHT_SCALE}
                      >
                        {code[i] || ""}
                      </Text>
                    </View>
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={codeInput}
                  style={styles.hidden}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t.replace(/[^0-9]/g, ""));
                    setError("");
                  }}
                  caretHidden
                  editable={!busy}
                />

                {!!error && (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                )}

                <Button
                  label={verifyLabel}
                  onPress={verify}
                  disabled={code.length !== CODE_LENGTH}
                  busy={busy}
                  style={{ marginTop: 22 }}
                />

                {seconds > 0 ? (
                  <Text style={styles.wait}>Resend in {seconds}s</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resend}
                    onPress={() => send(true)}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.resendText}>Send a new code</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: 14, paddingVertical: 10 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24 },

  icon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.h1,
    color: colors.textDark,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 21,
    color: colors.textMid,
    marginBottom: 26,
  },
  changeLink: { fontFamily: fonts.semibold, color: colors.primary },

  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  code: {
    fontFamily: fonts.semibold,
    fontSize: size.lg,
    color: colors.textDark,
  },
  divider: { width: 1, height: 22, backgroundColor: colors.border },
  phoneInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: size.xl,
    color: colors.textDark,
    letterSpacing: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },

  boxRow: { flexDirection: "row", gap: 9 },
  codeBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  codeBoxActive: { borderColor: colors.primary },
  codeText: {
    fontFamily: fonts.bold,
    fontSize: size.h2,
    color: colors.textDark,
  },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },

  error: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.danger,
    marginTop: 14,
  },

  wait: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 20,
  },
  resend: { alignItems: "center", paddingVertical: 18 },
  resendText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.primary,
  },
});
