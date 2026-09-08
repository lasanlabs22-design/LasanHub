import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../lib/auth";
import { ROLES, Role } from "../data/roles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_W = (SCREEN_WIDTH - 48 - 20) / 3;

export default function AuthScreen({
  onContinue,
}: {
  onContinue: (role: Role) => void;
}) {
  const { setPrefill } = useAuth();

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
      <LinearGradient
        colors={[colors.ink, colors.inkSoft, colors.ink]}
        style={StyleSheet.absoluteFill}
      />

      {/* The glow takes the chosen role's colour — the whole screen
          responds to the choice, not just the card */}
      <Glow accent={chosenMeta?.accent || colors.primary} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.body}>
          <Text style={styles.kicker}>ONE LAST THING</Text>

          <Text style={styles.title}>
            Which one{"\n"}
            <Text style={{ color: chosenMeta?.accent || colors.primaryLight }}>
              are you?
            </Text>
          </Text>

          <View style={styles.cardRow}>
            {ROLES.map((r, i) => (
              <RoleCard
                key={r.key}
                role={r}
                index={i}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

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
          >
            <Text
              style={[
                styles.primaryText,
                !chosen && { color: "rgba(255,255,255,0.35)" },
              ]}
            >
              {chosen ? `Continue as ${chosenMeta?.label}` : "Pick one"}
            </Text>
            {chosen && (
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
          >
            <MaterialCommunityIcons
              name="google"
              size={17}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.googleText}>
              {googleBusy ? "Signing in…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            We'll verify your number before your profile goes live
          </Text>
        </View>
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
  active,
  dimmed,
  onPress,
}: {
  role: (typeof ROLES)[number];
  index: number;
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
        style={[
          styles.card,
          {
            borderColor: active ? role.accent : "rgba(255,255,255,0.1)",
            backgroundColor: active
              ? `${role.accent}1F`
              : "rgba(255,255,255,0.04)",
          },
          dimmed && styles.cardDimmed,
        ]}
      >
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: active ? role.accent : `${role.accent}26` },
          ]}
        >
          <MaterialCommunityIcons
            name={role.icon as any}
            size={24}
            color={active ? colors.white : role.accent}
          />
        </View>

        <Text
          style={[
            styles.cardLabel,
            active && { color: colors.white, fontFamily: fonts.bold },
          ]}
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

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 50 },

  kicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2.4,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 42,
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 40,
  },

  cardRow: { flexDirection: "row", gap: 10 },
  card: {
    width: CARD_W,
    height: CARD_W * 1.24,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
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
    fontSize: 13.5,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
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

  taglineBox: { height: 40, justifyContent: "center", marginTop: 18 },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  spacer: { flex: 1, minHeight: 20 },

  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#FF8080",
    textAlign: "center",
    marginBottom: 12,
  },

  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 17,
  },
  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    color: colors.white,
  },

  google: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 52,
    marginTop: 10,
  },
  googleText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  off: { opacity: 0.3 },

  legal: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.28)",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
});
