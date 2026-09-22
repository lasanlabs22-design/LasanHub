import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

/** A pill that can be switched on and off — categories, services, reasons */
export default function Chip({
  label,
  active,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !!disabled }}
    >
      {!!icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={15}
          color={active ? colors.white : colors.textMid}
        />
      )}
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textMid,
  },
  textActive: { color: colors.white, fontFamily: fonts.semibold },
});
