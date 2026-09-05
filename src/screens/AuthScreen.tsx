import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../lib/auth";
import Button from "../components/Button";

/**
 * The intro. No verification here — the creator fills in their profile
 * first and proves their number when they submit, so nobody hits an OTP
 * before they've seen what they're signing up for.
 */
export default function AuthScreen({ onContinue }: { onContinue: () => void }) {
  const { setPrefill } = useAuth();

  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    if (googleBusy) return;

    setGoogleBusy(true);
    setError("");

    try {
      const user = await signInWithGoogle();

      // Google gives us a name, email and photo — never a number,
      // so we hold these to prefill the form
      setPrefill({ name: user.name, email: user.email, photo: user.photo });
      onContinue();
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
        <View style={styles.body}>
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
            Join our verified creator network. Businesses across Andhra Pradesh
            find you here.
          </Text>

          <View style={styles.points}>
            {[
              { icon: "shield-check-outline", text: "Verified creators only" },
              { icon: "currency-inr", text: "You set your own rate" },
              { icon: "handshake-outline", text: "We handle the negotiating" },
            ].map((p) => (
              <View key={p.text} style={styles.point}>
                <MaterialCommunityIcons
                  name={p.icon as any}
                  size={17}
                  color={colors.primaryLight}
                />
                <Text style={styles.pointText}>{p.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.spacer} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

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

          <Button
            label="Get started"
            onPress={onContinue}
            style={{ marginTop: 12 }}
          />

          <Text style={styles.legal}>
            We'll verify your mobile number before your profile goes live
          </Text>
        </View>
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

  body: { flex: 1, paddingHorizontal: 26, paddingTop: 44 },

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

  points: { marginTop: 30, gap: 14 },
  point: { flexDirection: "row", alignItems: "center", gap: 11 },
  pointText: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: "rgba(255,255,255,0.82)",
  },

  spacer: { flex: 1, minHeight: 24 },

  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#FF8080",
    marginBottom: 14,
    textAlign: "center",
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
    marginBottom: 14,
  },
});
