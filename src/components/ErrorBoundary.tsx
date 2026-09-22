import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { devLog } from "../lib/log";
import Button from "./Button";

/**
 * Catches a rendering crash anywhere below it and shows a way back,
 * instead of the app closing on the partner.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    devLog("Render crash:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={28}
            color={colors.primary}
          />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.text}>
          Sorry about that. Try again, and if it keeps happening, message our
          team from the Account tab.
        </Text>
        <Button
          label="Try again"
          onPress={() => this.setState({ failed: false })}
          style={styles.button}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: size.xl,
    color: colors.textDark,
    marginBottom: 8,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.textMid,
    textAlign: "center",
  },
  button: { marginTop: 24, alignSelf: "stretch" },
});
