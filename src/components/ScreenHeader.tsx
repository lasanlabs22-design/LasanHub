import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

const SIDE = 40;

/**
 * The header on pushed screens: back button, centred title, and an
 * optional control on the right. Leave `onBack` out to hide the button
 * but keep the title centred.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity
          style={styles.back}
          onPress={onBack}
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
      ) : (
        <View style={styles.side} />
      )}

      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

/** The larger left-aligned title on the four tab screens */
export function TabHeader({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.tabHeader}>
      <Text style={styles.tabTitle} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: SIDE,
    height: SIDE,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  side: { minWidth: SIDE },
  right: { alignItems: "flex-end" },
  middle: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: {
    fontFamily: fonts.semibold,
    fontSize: size.xl,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: size.xxs,
    color: colors.primary,
    marginTop: 1,
  },

  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tabTitle: {
    fontFamily: fonts.bold,
    fontSize: size.h1,
    color: colors.textDark,
    letterSpacing: -0.6,
  },
});
