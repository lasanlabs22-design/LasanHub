import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

type Props = TextInputProps & {
  label: string;
  prefix?: string;
  hint?: string;
  multiline?: boolean;
};

export default function Field({
  label,
  prefix,
  hint,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.box,
          multiline && styles.boxTall,
          focused && styles.boxFocused,
        ]}
      >
        {!!prefix && <Text style={styles.prefix}>{prefix}</Text>}

        <TextInput
          style={[styles.input, multiline && styles.inputTall]}
          placeholderTextColor={colors.textLight}
          accessibilityLabel={label.replace(/\s*\*$/, "")}
          accessibilityHint={hint}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>

      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textMid,
    marginBottom: 8,
  },
  /* minHeight so larger system fonts grow the box rather than clip it */
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  boxTall: { minHeight: 110, alignItems: "flex-start", paddingVertical: 15 },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  prefix: {
    fontFamily: fonts.semibold,
    fontSize: size.base,
    color: colors.textMid,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: size.base,
    color: colors.textDark,
    padding: 0,
  },
  inputTall: { minHeight: 80, lineHeight: 21 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    marginTop: 6,
  },
});
