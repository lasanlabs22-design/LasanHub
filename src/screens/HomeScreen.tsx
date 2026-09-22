import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, statusMeta } from "../theme/colors";
import { fonts, size, TIGHT_SCALE } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { roleMeta, Role } from "../data/roles";
import StrengthCard from "../components/StrengthCard";
import { fetchUnreadCount, CreatorProfile } from "../api/client";
import type { RootNavigation } from "../navigation/types";

/** What "you're live" actually means, per role */
const LIVE_TEXT: Record<Role, string> = {
  influencer: "You're live. Businesses can now find you and request campaigns.",
  vendor:
    "You're live. When a client needs what you offer, our team comes to you.",
  freelancer:
    "You're live. Briefs will come to you as our clients need your skills.",
};

/** The three steps, told in each role's own language */
const STEPS: Record<Role, { t: string; d: string }[]> = {
  influencer: [
    {
      t: "Create your profile",
      d: "Photo, handle, rate and what you post about",
    },
    {
      t: "We verify you",
      d: "Our team checks the account is genuinely yours",
    },
    {
      t: "Get campaign requests",
      d: "Businesses find you and our team gets in touch",
    },
  ],
  vendor: [
    {
      t: "List what you offer",
      d: "Services, coverage area and rough pricing",
    },
    { t: "We verify the business", d: "Company details and GST, checked once" },
    {
      t: "We send you jobs",
      d: "Real briefs from clients who have already paid",
    },
  ],
  freelancer: [
    { t: "Show us your work", d: "Skills, portfolio and what you charge" },
    { t: "We review it properly", d: "A real person looks at your portfolio" },
    {
      t: "Briefs come to you",
      d: "Scoped and priced before they reach you",
    },
  ],
};

function statusExplanation(profile: CreatorProfile): string {
  switch (profile.status) {
    case "pending":
      return "Our team is checking your details. We'll let you know within a day or two.";
    case "approved":
      return LIVE_TEXT[profile.role];
    case "rejected":
      return (
        profile.review_note || "We need a few changes before approving you."
      );
    default:
      return "Your profile is paused. Contact us to go live again.";
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { profile, phone, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      fetchUnreadCount().then(setUnread);
    }, [refreshProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProfile(),
      fetchUnreadCount().then(setUnread),
    ]);
    setRefreshing(false);
  };

  // Tabs only mount once a profile exists
  if (!profile) return null;

  const status = statusMeta[profile.status] || statusMeta.none;
  const meta = roleMeta(profile.role);

  const shownPhone = phone || profile.phone;
  const phoneLine = shownPhone ? `+91 ${shownPhone}` : "";

  const subtitle =
    profile.role === "vendor"
      ? profile.company_name || phoneLine
      : profile.instagram_id
        ? `@${profile.instagram_id}`
        : phoneLine;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Status — the main thing they open the app for */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View pointerEvents="none" style={styles.cardGlow} />

          <View style={styles.statusTop}>
            {profile.photo_url ? (
              <Image
                source={{ uri: profile.photo_url }}
                style={styles.avatar}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarLetter}>
                  {(profile.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>
              {!!subtitle && (
                <Text style={styles.handle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* The bell sits above the role tag, stacked to the right */}
            <View style={styles.rightStack}>
              <TouchableOpacity
                style={styles.bell}
                activeOpacity={0.8}
                hitSlop={8}
                onPress={() => navigation.navigate("Notifications")}
                accessibilityRole="button"
                accessibilityLabel={
                  unread > 0
                    ? `Updates, ${unread} unread`
                    : "Updates, none unread"
                }
              >
                <MaterialCommunityIcons
                  name={unread > 0 ? "bell-badge" : "bell-outline"}
                  size={20}
                  color={colors.white}
                />

                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text
                      style={styles.badgeText}
                      maxFontSizeMultiplier={TIGHT_SCALE}
                    >
                      {unread > 9 ? "9+" : unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.rolePill}>
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={12}
                  color={colors.white}
                />
                <Text style={styles.roleText} maxFontSizeMultiplier={TIGHT_SCALE}>
                  {meta.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={styles.statusText}>{status.label}</Text>
          </View>

          <Text style={styles.statusExplain}>
            {statusExplanation(profile)}
          </Text>
        </LinearGradient>

        {/* How complete their profile is */}
        <StrengthCard
          profile={profile}
          onPress={() => navigation.navigate("Profile")}
        />

        {/* How it works — told in this role's language */}
        <Text style={styles.sectionLabel} accessibilityRole="header">
          HOW IT WORKS
        </Text>

        <View style={styles.stepsCard}>
          {STEPS[profile.role].map((step, i) => (
            <View key={step.t} style={[styles.step, i > 0 && styles.stepGap]}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText} maxFontSizeMultiplier={TIGHT_SCALE}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.t}</Text>
                <Text style={styles.stepText}>{step.d}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },

  statusCard: {
    borderRadius: 22,
    padding: 20,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGlow: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarEmpty: {
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: size.h2,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: size.h3,
    color: colors.white,
    letterSpacing: -0.5,
  },
  handle: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  rightStack: { alignItems: "flex-end", gap: 10 },

  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.badge,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: size.xxs,
    color: colors.ink,
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  roleText: {
    fontFamily: fonts.semibold,
    fontSize: size.xxs,
    color: colors.white,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.white,
  },
  statusExplain: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: size.xxs,
    color: colors.textLight,
    letterSpacing: 0.9,
    marginTop: 28,
    marginBottom: 12,
  },

  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  step: { flexDirection: "row", gap: 13 },
  stepGap: { marginTop: 18 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    fontFamily: fonts.bold,
    fontSize: size.xs,
    color: colors.white,
  },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: size.base,
    color: colors.textDark,
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    lineHeight: 18,
    color: colors.textMid,
    marginTop: 2,
  },
});
