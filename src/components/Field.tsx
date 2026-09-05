import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

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
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}

        <TextInput
          style={[styles.input, multiline && styles.inputTall]}
          placeholderTextColor={colors.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          {...rest}
        />
      </View>

      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
    marginBottom: 8,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  boxTall: { height: 110, alignItems: "flex-start", paddingVertical: 15 },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  prefix: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textMid,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
  },
  inputTall: { height: "100%", lineHeight: 21 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textLight,
    marginTop: 6,
  },
});
