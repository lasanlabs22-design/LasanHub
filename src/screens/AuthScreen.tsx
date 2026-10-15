import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../lib/auth";
import { ROLES, Role } from "../data/roles";
import Shimmer from "../components/Shimmer";

const SIDE_PADDING = 24;

/* Ring around the chosen card: always reserved, so choosing
   doesn't shift the layout */
const RING = 2;
const RING_GAP = 3;

/**
 * Built like Lasan Mart's home banners (Bespoke, Business Ideas,
 * Influencer Marketing) — gradient card, orb, sheen, shimmer — each
 * in its role's colour. Deep enough at the start that white text
 * holds up over the light end.
 */
const CARD_LOOK: Record<Role, { gradient: [string, string]; tag: string }> = {
  influencer: { gradient: ["#B82E7C", "#561A86"], tag: "BRAND DEALS" },
  vendor: { gradient: ["#0B8F68", "#04503A"], tag: "CAMPAIGN ORDERS" },
  freelancer: { gradient: ["#2F6FE6", "#1B3A8F"], tag: "PAID GIGS" },
};

export default function AuthScreen({
  onContinue,
  onExisting,
}: {
  onContinue: (role: Role) => void;
  onExisting: () => void;
}) {
  const { setPrefill } = useAuth();
  const { width } = useWindowDimensions();

  /* How far the shimmer travels across a card */
  const cardWidth = width - SIDE_PADDING * 2;

  const [chosen, setChosen] = useState<Role | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const chosenMeta = ROLES.find((r) => r.key === chosen);

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
      <StatusBar style="dark" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>ONE LAST THING</Text>

          <Text style={styles.title} accessibilityRole="header">
            Which one{"\n"}
            <Text style={{ color: chosenMeta?.accent || colors.primary }}>
              are you?
            </Text>
          </Text>

          <View style={styles.cardList}>
            {ROLES.map((r, i) => (
              <RoleCard
                key={r.key}
                role={r}
                index={i}
                width={cardWidth}
                active={chosen === r.key}
                dimmed={!!chosen && chosen !== r.key}
                onPress={() => setChosen(chosen === r.key ? null : r.key)}
              />
            ))}
          </View>

          <View style={styles.spacer} />

          {!!error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.primary,
              { backgroundColor: chosenMeta?.accent || colors.surfaceDeep },
            ]}
            activeOpacity={0.9}
            onPress={() => chosen && onContinue(chosen)}
            disabled={!chosen}
            accessibilityRole="button"
            accessibilityState={{ disabled: !chosen }}
          >
            <Text
              style={[styles.primaryText, !chosen && styles.primaryTextOff]}
            >
              {chosen ? `Continue as ${chosenMeta?.label}` : "Pick one"}
            </Text>
            {!!chosen && (
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={colors.white}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.google, !chosen && styles.off]}
            activeOpacity={0.85}
            onPress={handleGoogle}
            disabled={!chosen || googleBusy}
            accessibilityRole="button"
            accessibilityState={{ disabled: !chosen || googleBusy }}
          >
            <MaterialCommunityIcons
              name="google"
              size={17}
              color={colors.textDark}
            />
            <Text style={styles.googleText}>
              {googleBusy ? "Signing in…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {/* No role needed here — a returning user already has one saved */}
          <TouchableOpacity
            style={styles.returning}
            activeOpacity={0.7}
            onPress={onExisting}
            accessibilityRole="button"
            accessibilityLabel="Already registered? Sign in"
          >
            <MaterialCommunityIcons
              name="account-check-outline"
              size={15}
              color={colors.textMid}
            />
            <Text style={styles.returningText}>
              Already registered?{" "}
              <Text style={styles.returningLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            We'll verify your number before your profile goes live
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------- One role card ---------- */

function RoleCard({
  role,
  index,
  width,
  active,
  dimmed,
  onPress,
}: {
  role: (typeof ROLES)[number];
  index: number;
  width: number;
  active: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  const look = CARD_LOOK[role.key];
  const enter = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  /* Cards fan in one after another */
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 500,
      delay: 120 + index * 110,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  /* The chosen card swells slightly and holds — no rise, the
     stacked neighbours are too close */
  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [active, lift]);

  const translateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const scale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        { borderColor: active ? role.accent : "transparent" },
        // The others fade once one is chosen — by then they've entered
        { opacity: dimmed ? 0.5 : enter, transform: [{ translateY }, { scale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        accessibilityLabel={`${role.label}. ${role.tagline}`}
      >
        <LinearGradient
          colors={look.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Decorative shapes, as on Lasan Mart's banners. Passes are
              staggered so the three never sweep together. */}
          <View pointerEvents="none" style={styles.orb} />
          <View pointerEvents="none" style={styles.sheen} />
          <Shimmer width={width} opacity={0.2} delay={2400 + index * 900} />

          <View style={styles.iconTile}>
            <MaterialCommunityIcons
              name={role.icon as any}
              size={24}
              color={colors.white}
            />
          </View>

          <View style={styles.cardText}>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{look.tag}</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>{role.label}</Text>
            <Text style={styles.cardTagline}>{role.tagline}</Text>
          </View>

          <View style={[styles.radio, active && styles.radioOn]}>
            {active && (
              <MaterialCommunityIcons
                name="check"
                size={17}
                color={look.gradient[1]}
              />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  body: {
    flexGrow: 1,
    paddingHorizontal: SIDE_PADDING - RING - RING_GAP,
    paddingTop: 40,
    paddingBottom: 16,
  },

  kicker: {
    fontFamily: fonts.bold,
    fontSize: size.xxs,
    letterSpacing: 2.4,
    color: colors.textLight,
    marginBottom: 12,
    marginHorizontal: RING + RING_GAP,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.hero,
    lineHeight: 42,
    color: colors.textDark,
    letterSpacing: -1,
    marginBottom: 26,
    marginHorizontal: RING + RING_GAP,
  },

  cardList: { gap: 8 },
  ring: {
    borderRadius: 20 + RING + RING_GAP,
    borderWidth: RING,
    padding: RING_GAP,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    // A floor, not a fixed size: with large text the tagline wraps
    // and the card grows instead of cutting it off
    minHeight: 96,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  orb: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  sheen: {
    position: "absolute",
    top: -30,
    left: -40,
    width: 70,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ rotate: "22deg" }],
  },
  iconTile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardText: { flex: 1 },
  tagRow: { flexDirection: "row", marginBottom: 5 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.8,
  },
  cardLabel: {
    fontFamily: fonts.bold,
    fontSize: size.xl,
    color: colors.white,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  cardTagline: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    lineHeight: 17,
    color: "rgba(255,255,255,0.78)",
  },
  radio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  radioOn: { backgroundColor: colors.white, borderColor: colors.white },

  spacer: { flex: 1, minHeight: 24 },

  error: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },

  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
    paddingVertical: 14,
    borderRadius: 17,
    marginHorizontal: RING + RING_GAP,
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: size.lg,
    color: colors.white,
  },
  primaryTextOff: { color: colors.textLight },

  google: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 52,
    marginTop: 10,
    marginHorizontal: RING + RING_GAP,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.textDark,
  },
  off: { opacity: 0.4 },

  returning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 48,
    paddingVertical: 12,
  },
  returningText: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textMid,
  },
  returningLink: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },

  legal: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 6,
  },
});
