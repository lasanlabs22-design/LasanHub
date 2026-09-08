import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { Role, roleMeta } from "../data/roles";
import Button from "../components/Button";

/** What we're actually offering each type of partner */
const PITCH: Record<
  Role,
  {
    headline: string;
    body: string;
    steps: { icon: string; title: string; text: string }[];
  }
> = {
  influencer: {
    headline: "Brands find you,\nnot the other way round",
    body: "Businesses across Andhra Pradesh browse creators on Lasan Mart. Set your rate once and let the work come to you.",
    steps: [
      {
        icon: "instagram",
        title: "Add your handle and rate",
        text: "We check the account is genuinely yours",
      },
      {
        icon: "eye-outline",
        title: "Businesses browse you",
        text: "They filter by budget and what you post about",
      },
      {
        icon: "phone-in-talk-outline",
        title: "We bring you the brief",
        text: "Our team handles the negotiating and the paperwork",
      },
    ],
  },
  vendor: {
    headline: "Steady work,\nwithout the chasing",
    body: "When a business needs hoardings, printing or a field team, our team comes to the vendors on this list first.",
    steps: [
      {
        icon: "clipboard-list-outline",
        title: "Tell us what you do",
        text: "Services, coverage area and rough pricing",
      },
      {
        icon: "shield-check-outline",
        title: "We verify your business",
        text: "Company details and GST, checked once",
      },
      {
        icon: "briefcase-outline",
        title: "We send you jobs",
        text: "Real briefs from businesses who have already paid",
      },
    ],
  },
  freelancer: {
    headline: "Get briefed,\nnot ghosted",
    body: "Design, video, writing — when our clients need it, we come to you. No bidding, no undercutting, no chasing invoices.",
    steps: [
      {
        icon: "palette-outline",
        title: "Show us your work",
        text: "Skills, portfolio and what you charge",
      },
      {
        icon: "account-check-outline",
        title: "We review it properly",
        text: "A real person looks at your portfolio",
      },
      {
        icon: "file-document-edit-outline",
        title: "Briefs come to you",
        text: "Scoped and priced before they reach you",
      },
    ],
  },
};

export default function WelcomeScreen({
  role,
  onContinue,
  onBack,
}: {
  role: Role;
  onContinue: () => void;
  onBack: () => void;
}) {
  const meta = roleMeta(role);
  const pitch = PITCH[role];

  const rise = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    drift.start();

    return () => drift.stop();
  }, [rise, float]);

  const slideUp = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const lift = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.ink, colors.inkSoft, colors.ink]}
        style={StyleSheet.absoluteFill}
      />

      {/* The glow takes the role's colour, so each welcome feels different */}
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: meta.accent }]}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: rise, transform: [{ translateY: slideUp }] }}
          >
            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: `${meta.accent}26` },
                { transform: [{ translateY: lift }] },
              ]}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={30}
                color={meta.accent}
              />
            </Animated.View>

            <Text style={[styles.eyebrow, { color: meta.accent }]}>
              {meta.label.toUpperCase()}
            </Text>

            <Text style={styles.headline}>{pitch.headline}</Text>
            <Text style={styles.pitchBody}>{pitch.body}</Text>

            <View style={styles.steps}>
              {pitch.steps.map((s, i) => (
                <View key={s.title} style={styles.step}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepIcon,
                        { backgroundColor: `${meta.accent}1F` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={s.icon as any}
                        size={17}
                        color={meta.accent}
                      />
                    </View>

                    {i < pitch.steps.length - 1 && (
                      <View style={styles.stepLine} />
                    )}
                  </View>

                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepBody}>{s.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Set up my profile" onPress={onContinue} />

          <Text style={styles.backLink} onPress={onBack}>
            I'm something else
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
    top: "-14%",
    alignSelf: "center",
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.22,
  },

  body: { paddingHorizontal: 26, paddingTop: 32, paddingBottom: 20 },

  badge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2.2,
    marginBottom: 12,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 29,
    lineHeight: 37,
    color: colors.white,
    letterSpacing: -0.9,
  },
  pitchBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.52)",
    marginTop: 12,
  },

  steps: { marginTop: 34 },
  step: { flexDirection: "row", gap: 14 },
  stepLeft: { alignItems: "center" },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  stepLine: {
    flex: 1,
    width: 1.5,
    minHeight: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  stepText: { flex: 1, paddingBottom: 22 },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    color: colors.white,
  },
  stepBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.48)",
    marginTop: 3,
  },

  footer: { paddingHorizontal: 26, paddingBottom: 20 },
  backLink: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    paddingVertical: 18,
  },
});
