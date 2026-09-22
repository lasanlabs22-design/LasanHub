import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "solid" | "outline" | "ghost";
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  label,
  onPress,
  variant = "solid",
  disabled,
  busy,
  style,
}: Props) {
  const off = disabled || busy;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={off}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      style={[
        styles.base,
        variant === "solid" && styles.solid,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        off && styles.off,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "solid" ? colors.white : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "solid" ? styles.labelSolid : styles.labelQuiet,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /* minHeight, not height — a large system font grows the button
     instead of clipping the label */
  base: {
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: { backgroundColor: colors.primary },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  ghost: { backgroundColor: "transparent" },
  off: { opacity: 0.4 },
  label: { fontFamily: fonts.semibold, fontSize: size.lg, textAlign: "center" },
  labelSolid: { color: colors.white },
  labelQuiet: { color: colors.primary },
});
