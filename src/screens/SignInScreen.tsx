import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { fetchMyProfile } from "../api/client";
import VerifySheet from "../screens/VerifySheet";
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

  const handleVerified = async () => {
    setOpen(false);
    markSignedIn();

    const profile = await fetchMyProfile();

    if (profile) {
      await refreshProfile();
      onDone();
      return;
    }

    Alert.alert(
      "No profile found",
      "We don't have anything saved against this number yet. Your number is verified, so you can carry on and set one up now.",
      [{ text: "Continue", onPress: onDone }],
    );
  };

  return (
    <View style={styles.root}>
      <VerifySheet
        visible={open}
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
  root: { flex: 1, backgroundColor: colors.ink },
});
