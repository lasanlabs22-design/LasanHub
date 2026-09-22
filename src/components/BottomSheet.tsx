import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";

/**
 * A sheet that slides up from the bottom, with a title, optional
 * explanation, whatever content the caller passes, and a Cancel link.
 */
export default function BottomSheet({
  visible,
  title,
  body,
  onClose,
  closeDisabled,
  children,
}: {
  visible: boolean;
  title: string;
  body?: string;
  onClose: () => void;
  /** Stops Cancel and the back button while something is sending */
  closeDisabled?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!closeDisabled) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.grabber} />

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {!!body && <Text style={styles.body}>{body}</Text>}

          <View style={styles.content}>{children}</View>

          <TouchableOpacity
            style={styles.cancel}
            onPress={onClose}
            disabled={closeDisabled}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.h3,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.textMid,
    marginTop: 6,
  },
  content: { marginTop: 16 },
  cancel: { alignItems: "center", paddingVertical: 16 },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.textLight,
  },
});
