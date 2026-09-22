import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

/** Icon, title and a line of explanation — for empty lists and blocked states */
export default function EmptyState({
  icon,
  title,
  text,
  fill,
  children,
}: {
  icon: string;
  title: string;
  text: string;
  /** Centre in the available space instead of sitting near the top */
  fill?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.wrap, fill && styles.fill]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name={icon as any}
          size={28}
          color={colors.textLight}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  fill: { flex: 1, justifyContent: "center", paddingTop: 0 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: size.xl,
    color: colors.textDark,
    marginBottom: 7,
    textAlign: "center",
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.textMid,
    textAlign: "center",
  },
});
