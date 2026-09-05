import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";

const SUPPORT_PHONE = "8309074248";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, phone, signOut } = useAuth();

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in with your number anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  const whatsapp = () =>
    Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}`).catch(() =>
      Linking.openURL(`tel:+91${SUPPORT_PHONE}`),
    );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Row
            icon="phone-outline"
            label="Mobile"
            value={`+91 ${phone || ""}`}
          />
          {profile?.email && (
            <Row icon="email-outline" label="Email" value={profile.email} />
          )}
          {profile?.instagram_id && (
            <Row
              icon="instagram"
              label="Instagram"
              value={`@${profile.instagram_id}`}
            />
          )}
        </View>

        <Text style={styles.sectionLabel}>HELP</Text>

        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.85}
          onPress={whatsapp}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#E6F8EE" }]}>
            <MaterialCommunityIcons name="whatsapp" size={19} color="#0EA97A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Message our team</Text>
            <Text style={styles.actionText}>
              Usually replies within a few hours
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>ABOUT</Text>

        <View style={styles.card}>
          <Row icon="information-outline" label="Version" value="1.0.0" />
          <Row
            icon="shield-check-outline"
            label="Privacy"
            value="lasanmart.com/privacy"
          />
        </View>

        <TouchableOpacity
          style={styles.signOut}
          activeOpacity={0.85}
          onPress={confirmSignOut}
        >
          <MaterialCommunityIcons
            name="logout"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Lasan Hub · Lasan Media Works</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={colors.textLight}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textDark,
    letterSpacing: -0.6,
  },

  content: { padding: 20, paddingTop: 4 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMid,
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.textDark,
    maxWidth: "55%",
  },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textLight,
    letterSpacing: 0.9,
    marginTop: 26,
    marginBottom: 12,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.textDark,
  },
  actionText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 2,
  },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 30,
    paddingVertical: 16,
  },
  signOutText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.danger,
  },

  footer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 10,
  },
});
