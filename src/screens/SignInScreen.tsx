import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import VerifySheet from "./VerifySheet";
import { colors } from "../theme/colors";

/**
 * For partners coming back on a new phone or after a reinstall.
 * Verifying the number is the lookup — the backend finds their
 * profile from the token, or tells us there isn't one.
 */
export default function SignInScreen({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const { markSignedIn, refreshProfile } = useAuth();
  const [open, setOpen] = useState(true);
  const [looking, setLooking] = useState(false);

  /** Once verified: find their profile, or say plainly that we couldn't */
  const lookUp = async () => {
    setLooking(true);
    const result = await refreshProfile();
    setLooking(false);

    if (!result.ok) {
      Alert.alert(
        "Couldn't reach our servers",
        "Your number is verified. Check your connection and try again.",
        [
          { text: "Later", style: "cancel", onPress: onCancel },
          { text: "Try again", onPress: lookUp },
        ],
      );
      return;
    }

    if (result.profile) {
      onDone();
      return;
    }

    Alert.alert(
      "No profile found",
      "We don't have anything saved against this number yet. Your number is verified, so you can carry on and set one up now.",
      [{ text: "Continue", onPress: onDone }],
    );
  };

  const handleVerified = () => {
    setOpen(false);
    markSignedIn();
    lookUp();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {looking && (
        <ActivityIndicator
          size="large"
          color={colors.primaryOnDark}
          accessibilityLabel="Finding your profile"
        />
      )}

      <VerifySheet
        visible={open}
        verifyLabel="Verify & sign in"
        onClose={() => {
          setOpen(false);
          onCancel();
        }}
        onVerified={handleVerified}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
});
