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
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../lib/auth";
import { ROLES, Role } from "../data/roles";

const SIDE_PADDING = 24;
const CARD_GAP = 10;

export default function AuthScreen({
  onContinue,
  onExisting,
}: {
  onContinue: (role: Role) => void;
  onExisting: () => void;
}) {
  const { setPrefill } = useAuth();
  const { width } = useWindowDimensions();

  /* Three across, from the live width. On the narrowest phones the
     label shrinks to fit (adjustsFontSizeToFit) instead of wrapping. */
  const cardWidth = (width - SIDE_PADDING * 2 - CARD_GAP * 2) / 3;

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
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.ink, colors.inkSoft, colors.ink]}
        style={StyleSheet.absoluteFill}
      />

      {/* The glow takes the chosen role's colour — the whole screen
          responds to the choice, not just the card */}
      <Glow accent={chosenMeta?.accent || colors.primary} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>ONE LAST THING</Text>

          <Text style={styles.title} accessibilityRole="header">
            Which one{"\n"}
            <Text style={{ color: chosenMeta?.accent || colors.primaryOnDark }}>
              are you?
            </Text>
          </Text>

          <View style={styles.cardRow}>
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

          {/* The tagline swaps as they choose */}
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>
              {chosenMeta ? chosenMeta.tagline : "Tap one to see what we offer"}
            </Text>
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
              {
                backgroundColor: chosenMeta?.accent || "rgba(255,255,255,0.1)",
              },
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
              color={colors.onDarkHigh}
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
              color={colors.onDarkLow}
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

/* ---------- The glow, which cross-fades between colours ---------- */

function Glow({ accent }: { accent: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glow, { backgroundColor: accent, transform: [{ scale }] }]}
    />
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

  /* The chosen card rises and holds */
  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [active, lift]);

  const translateY = Animated.add(
    enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
    lift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
  );

  const scale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY }, { scale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        accessibilityLabel={`${role.label}. ${role.tagline}`}
        style={[
          styles.card,
          {
            width,
            minHeight: width * 1.24,
            borderColor: active ? role.accent : "rgba(255,255,255,0.1)",
            backgroundColor: active
              ? tint(role.accent, 0.12)
              : "rgba(255,255,255,0.04)",
          },
          dimmed && styles.cardDimmed,
        ]}
      >
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: active ? role.accent : tint(role.accent, 0.15) },
          ]}
        >
          <MaterialCommunityIcons
            name={role.icon as any}
            size={24}
            color={active ? colors.white : role.accent}
          />
        </View>

        <Text
          style={[styles.cardLabel, active && styles.cardLabelActive]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {role.label}
        </Text>

        {active && (
          <View style={[styles.tick, { backgroundColor: role.accent }]}>
            <MaterialCommunityIcons
              name="check"
              size={11}
              color={colors.white}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  glow: {
    position: "absolute",
    top: "6%",
    alignSelf: "center",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.24,
  },

  body: {
    flexGrow: 1,
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 40,
    paddingBottom: 16,
  },

  kicker: {
    fontFamily: fonts.bold,
    fontSize: size.xxs,
    letterSpacing: 2.4,
    color: colors.onDarkLow,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.hero,
    lineHeight: 42,
    color: colors.onDark,
    letterSpacing: -1,
    marginBottom: 32,
  },

  cardRow: { flexDirection: "row", gap: CARD_GAP, justifyContent: "center" },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 14,
  },
  cardDimmed: { opacity: 0.45 },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.onDarkMid,
    textAlign: "center",
  },
  cardLabelActive: { color: colors.onDark, fontFamily: fonts.bold },
  tick: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  taglineBox: { minHeight: 40, justifyContent: "center", marginTop: 18 },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.onDarkMid,
    textAlign: "center",
  },

  spacer: { flex: 1, minHeight: 20 },

  error: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.dangerOnDark,
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
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: size.lg,
    color: colors.white,
  },
  primaryTextOff: { color: colors.onDarkLow },

  google: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 52,
    marginTop: 10,
  },
  googleText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.onDarkHigh,
  },
  off: { opacity: 0.3 },

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
    color: colors.onDarkLow,
  },
  returningLink: {
    fontFamily: fonts.semibold,
    color: colors.primaryOnDark,
  },

  legal: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.onDarkLow,
    textAlign: "center",
    marginTop: 6,
  },
});
