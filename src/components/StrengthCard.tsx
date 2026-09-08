import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { CreatorProfile } from "../api/client";
import { profileStrength, strengthLabel } from "../lib/strength";

export default function StrengthCard({
  profile,
  onPress,
}: {
  profile: CreatorProfile;
  onPress: () => void;
}) {
  const { percent, missing } = profileStrength(profile);
  const tone = strengthLabel(percent);

  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: percent,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, fill]);

  const width = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const complete = percent === 100;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: `${tone.color}1A` }]}>
          <MaterialCommunityIcons
            name={complete ? "shield-check" : "chart-arc"}
            size={20}
            color={tone.color}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Profile strength</Text>
          <Text style={styles.subtitle}>
            {complete
              ? "Everything our team needs"
              : `${missing.length} thing${missing.length === 1 ? "" : "s"} left`}
          </Text>
        </View>

        <View style={styles.percentBox}>
          <Text style={[styles.percent, { color: tone.color }]}>
            {percent}
            <Text style={styles.percentSign}>%</Text>
          </Text>
          <Text style={[styles.toneLabel, { color: tone.color }]}>
            {tone.label}
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width, backgroundColor: tone.color }]}
        />
      </View>

      {/* The next two things worth adding, rather than a wall of them */}
      {!complete && (
        <>
          <View style={styles.missingList}>
            {missing.slice(0, 2).map((m) => (
              <View key={m.key} style={styles.missingRow}>
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={14}
                  color={colors.textLight}
                />
                <Text style={styles.missingText}>{m.label}</Text>
              </View>
            ))}

            {missing.length > 2 && (
              <Text style={styles.moreText}>and {missing.length - 2} more</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={onPress}
          >
            <Text style={styles.buttonText}>Finish your profile</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={15}
              color={colors.primary}
            />
          </TouchableOpacity>
        </>
      )}

      {complete && (
        <View style={styles.doneRow}>
          <MaterialCommunityIcons
            name="check-circle"
            size={15}
            color={tone.color}
          />
          <Text style={[styles.doneText, { color: tone.color }]}>
            Nothing else needed
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textDark,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 1,
  },
  percentBox: { alignItems: "flex-end" },
  percent: {
    fontFamily: fonts.bold,
    fontSize: 23,
    letterSpacing: -0.8,
  },
  percentSign: { fontSize: 13 },
  toneLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    marginTop: -2,
  },

  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceDeep,
    overflow: "hidden",
    marginTop: 14,
  },
  fill: { height: "100%", borderRadius: 4 },

  missingList: { marginTop: 14, gap: 8 },
  missingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  missingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMid,
  },
  moreText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 22,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.primary,
  },

  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  doneText: { fontFamily: fonts.semibold, fontSize: 13 },
});
