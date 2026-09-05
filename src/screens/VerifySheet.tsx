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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { sendOtp, verifyOtp, Confirmation } from "../lib/auth";
import Button from "../components/Button";

const RESEND_SECONDS = 45;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Fires once the number is verified — the caller then saves */
  onVerified: (phone: string) => void;
};

/**
 * Collects and verifies a phone number, at the moment the creator
 * submits their profile. Nothing is saved until this passes, because
 * the backend identifies everyone by their verified number.
 */
export default function VerifySheet({ visible, onClose, onVerified }: Props) {
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
    if (code.length !== 6 || !confirmation || busy) return;

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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          {step === "phone" ? (
            <>
              <View style={styles.icon}>
                <MaterialCommunityIcons
                  name="cellphone-check"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.title}>Verify your number</Text>
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
                label="Send code"
                onPress={() => send()}
                disabled={phone.length !== 10}
                busy={busy}
                style={{ marginTop: 20 }}
              />

              <TouchableOpacity
                style={styles.cancel}
                onPress={onClose}
                disabled={busy}
              >
                <Text style={styles.cancelText}>Not now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.icon}>
                <MaterialCommunityIcons
                  name="message-text-lock-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.title}>Enter the code</Text>
              <Text style={styles.subtitle}>
                Sent to +91 {phone}{" "}
                <Text
                  style={styles.changeLink}
                  onPress={() => {
                    setStep("phone");
                    setCode("");
                    setError("");
                  }}
                >
                  Change
                </Text>
              </Text>

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
                label="Verify & submit"
                onPress={verify}
                disabled={code.length !== 6}
                busy={busy}
                style={{ marginTop: 20 }}
              />

              {seconds > 0 ? (
                <Text style={styles.wait}>Resend in {seconds}s</Text>
              ) : (
                <TouchableOpacity
                  style={styles.cancel}
                  onPress={() => send(true)}
                  disabled={busy}
                >
                  <Text style={styles.resendText}>Send a new code</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,10,31,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.textDark,
    letterSpacing: -0.5,
    marginBottom: 7,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
    marginBottom: 20,
  },
  changeLink: { fontFamily: fonts.semibold, color: colors.primary },

  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    height: 56,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  code: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.textDark },
  divider: { width: 1, height: 20, backgroundColor: colors.border },
  phoneInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textDark,
    letterSpacing: 1,
    padding: 0,
  },

  boxRow: { flexDirection: "row", gap: 8 },
  codeBox: {
    flex: 1,
    height: 54,
    borderRadius: 13,
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
  codeText: { fontFamily: fonts.bold, fontSize: 21, color: colors.textDark },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },

  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.danger,
    marginTop: 12,
  },

  cancel: { alignItems: "center", paddingVertical: 15, marginTop: 2 },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textLight,
  },
  resendText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
  },
  wait: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 18,
  },
});
