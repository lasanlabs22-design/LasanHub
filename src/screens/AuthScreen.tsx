import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../lib/auth";
import { ROLES, Role } from "../data/roles";

/**
 * The intro. Pick what you are, then continue — no verification yet.
 * The number gets proved when the profile is submitted, so nobody
 * hits an OTP before seeing what they're signing up for.
 */
export default function AuthScreen({
  onContinue,
}: {
  onContinue: (role: Role) => void;
}) {
  const { setPrefill } = useAuth();

  const [chosen, setChosen] = useState<Role | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    if (!chosen || googleBusy) return;

    setGoogleBusy(true);
    setError("");

    try {
      const user = await signInWithGoogle();
      setPrefill({ name: user.name, email: user.email, photo: user.photo });
      onContinue(chosen);
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
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mark}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={24}
              color={colors.white}
            />
          </View>

          <Text style={styles.brand}>LASAN HUB</Text>

          <Text style={styles.title}>Get found by{"\n"}local businesses</Text>

          <Text style={styles.subtitle}>
            Join our verified network. Businesses across Andhra Pradesh find you
            through Lasan Mart.
          </Text>

          <Text style={styles.pickLabel}>I am a</Text>

          <View style={styles.roleList}>
            {ROLES.map((r) => {
              const active = chosen === r.key;

              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setChosen(active ? null : r.key)}
                >
                  <View
                    style={[
                      styles.roleIcon,
                      { backgroundColor: `${r.accent}26` },
                      active && { backgroundColor: `${r.accent}40` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={r.icon as any}
                      size={22}
                      color={r.accent}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleLabel}>{r.label}</Text>
                    <Text style={styles.roleTagline}>{r.tagline}</Text>
                  </View>

                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && (
                      <MaterialCommunityIcons
                        name="check"
                        size={13}
                        color={colors.ink}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primary, !chosen && styles.disabled]}
              activeOpacity={0.9}
              onPress={() => chosen && onContinue(chosen)}
              disabled={!chosen}
            >
              <Text style={styles.primaryText}>
                {chosen ? "Continue" : "Pick one to continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.googleButton, !chosen && styles.disabled]}
              activeOpacity={0.85}
              onPress={handleGoogle}
              disabled={!chosen || googleBusy}
            >
              <MaterialCommunityIcons
                name="google"
                size={17}
                color={colors.white}
              />
              <Text style={styles.googleText}>
                {googleBusy ? "Signing in…" : "Continue with Google"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            We'll verify your mobile number before your profile goes live
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  glow: {
    position: "absolute",
    top: "-12%",
    alignSelf: "center",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.primary,
    opacity: 0.26,
  },

  body: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 30 },

  mark: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 29,
    lineHeight: 36,
    color: colors.white,
    letterSpacing: -0.9,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: "rgba(255,255,255,0.5)",
    marginTop: 10,
  },

  pickLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    marginTop: 32,
    marginBottom: 12,
  },

  roleList: { gap: 10 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
  },
  roleCardActive: {
    borderColor: colors.primaryLight,
    backgroundColor: "rgba(123,63,196,0.18)",
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  roleLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
  roleTagline: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.48)",
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },

  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#FF8080",
    textAlign: "center",
    marginTop: 16,
  },

  actions: { marginTop: 28, gap: 11 },
  primary: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    color: colors.white,
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
    fontSize: 14.5,
    color: colors.white,
  },
  disabled: { opacity: 0.35 },

  legal: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.28)",
    textAlign: "center",
    marginTop: 18,
  },
});
