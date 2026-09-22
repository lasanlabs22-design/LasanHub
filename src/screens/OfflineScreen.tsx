import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

/**
 * Shown when someone is signed in but we couldn't reach the server to
 * find their profile. Without this they'd be dropped into sign-up and
 * think their account was gone.
 */
export default function OfflineScreen() {
  const { refreshProfile, signOut, phone } = useAuth();
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    await refreshProfile();
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={28}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>Can't reach Lasan Hub</Text>
        <Text style={styles.text}>
          {phone ? `You're signed in as +91 ${phone}. ` : ""}
          Your profile is safe — we just couldn't load it. Check your
          connection and try again.
        </Text>

        <Button
          label="Try again"
          onPress={retry}
          busy={busy}
          style={styles.button}
        />
        <Button
          label="Sign out"
          variant="ghost"
          onPress={signOut}
          disabled={busy}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.h3,
    color: colors.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 21,
    color: colors.textMid,
    textAlign: "center",
  },
  button: { marginTop: 26, alignSelf: "stretch" },
});
