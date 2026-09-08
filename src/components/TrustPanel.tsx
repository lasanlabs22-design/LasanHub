import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const POINTS = [
  {
    icon: "shield-check-outline",
    title: "A person reads every profile",
    body: "Someone on our team checks your details against what you have told us. No automated approvals.",
  },
  {
    icon: "eye-outline",
    title: "Businesses see your work, not your details",
    body: "Once approved, clients browsing Lasan Mart see your name, rate and what you offer. Your number and email stay with our team until you agree to a job.",
  },
  {
    icon: "lock-outline",
    title: "We never sell your information",
    body: "Not to advertisers, not to anyone. It is used to bring you work and nothing else.",
  },
  {
    icon: "delete-outline",
    title: "Leave whenever you like",
    body: "Message us and we remove your profile and everything attached to it within 30 days.",
  },
];

/**
 * Sits at the foot of the profile form. Two jobs: it tells people what
 * happens to what they have just typed, and it gives the last field
 * room to scroll clear of the keyboard.
 */
export default function TrustPanel() {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  return (
    <View style={styles.wrap}>
      <View style={styles.divider} />

      <Text style={styles.heading}>What happens to all this</Text>

      <View style={styles.list}>
        {POINTS.map((p, i) => (
          <Point key={p.title} point={p} index={i} rise={rise} />
        ))}
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={colors.textLight}
        />
        <Text style={styles.footerText}>
          Full detail at lasanmart.com/privacy
        </Text>
      </View>
    </View>
  );
}

function Point({
  point,
  index,
  rise,
}: {
  point: (typeof POINTS)[number];
  index: number;
  rise: Animated.Value;
}) {
  /* Each one arrives a beat after the last */
  const start = index * 0.15;
  const end = Math.min(1, start + 0.5);

  const opacity = rise.interpolate({
    inputRange: [start, end],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const translateY = rise.interpolate({
    inputRange: [start, end],
    outputRange: [14, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[styles.point, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.pointIcon}>
        <MaterialCommunityIcons
          name={point.icon as any}
          size={17}
          color={colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.pointTitle}>{point.title}</Text>
        <Text style={styles.pointBody}>{point.body}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 34 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 26,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textLight,
    textTransform: "uppercase",
    marginBottom: 20,
  },

  list: { gap: 22 },
  point: { flexDirection: "row", gap: 13 },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  pointTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.textDark,
    lineHeight: 20,
  },
  pointBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMid,
    marginTop: 3,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
  },
});
