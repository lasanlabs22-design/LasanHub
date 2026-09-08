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
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, statusMeta } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { roleMeta, Role } from "../data/roles";
import StrengthCard from "../components/StrengthCard";

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
    { t: "We verify you", d: "Our team checks the account is genuinely yours" },
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
    { t: "Briefs come to you", d: "Scoped and priced before they reach you" },
  ],
};

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile, phone, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const status = profile ? statusMeta[profile.status] : statusMeta.none;
  const role: Role = profile?.role || "influencer";
  const meta = roleMeta(role);

  /** The line under the name — whatever identifies them best */
  const subtitle =
    role === "vendor"
      ? profile?.company_name || `+91 ${phone}`
      : profile?.instagram_id
        ? `@${profile.instagram_id}`
        : `+91 ${phone}`;

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
          />
        }
      >
        {/* Status card — the main thing they open the app for */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View pointerEvents="none" style={styles.cardGlow} />

          <View style={styles.statusTop}>
            {profile?.photo_url ? (
              <Image
                source={{ uri: profile.photo_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarLetter}>
                  {(profile?.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.name || "Welcome"}
              </Text>
              <Text style={styles.handle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>

            {profile && (
              <View style={styles.rolePill}>
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={12}
                  color={colors.white}
                />
                <Text style={styles.roleText}>{meta.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={styles.statusText}>{status.label}</Text>
          </View>

          <Text style={styles.statusExplain}>
            {!profile
              ? "Create your profile to get listed with local businesses."
              : profile.status === "pending"
                ? "Our team is checking your details. We'll let you know within a day or two."
                : profile.status === "approved"
                  ? LIVE_TEXT[role]
                  : profile.status === "rejected"
                    ? profile.review_note ||
                      "We need a few changes before approving you."
                    : "Your profile is paused. Contact us to go live again."}
          </Text>
        </LinearGradient>

        {profile && (
          <StrengthCard
            profile={profile}
            onPress={() => navigation.navigate("Profile")}
          />
        )}

        {/* Primary action */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons
              name={profile ? "pencil-outline" : "account-plus-outline"}
              size={profile ? 20 : 22}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              {profile ? "Edit profile" : "Create your profile"}
            </Text>
            <Text style={styles.actionText}>
              {!profile
                ? "Takes about two minutes"
                : role === "influencer"
                  ? "Update your rate, bio or photo"
                  : "Update your rate card, services or photo"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>

        {/* Details, once there's a profile — different per role */}
        {profile && (
          <>
            <Text style={styles.sectionLabel}>YOUR DETAILS</Text>

            <View style={styles.detailCard}>
              {role === "influencer" && (
                <>
                  <Detail
                    label="Instagram"
                    value={
                      profile.instagram_id ? `@${profile.instagram_id}` : null
                    }
                  />
                  <Detail label="Posts about" value={profile.category} />
                  <Detail label="Followers" value={profile.followers} />
                  <Detail label="City" value={profile.city} />
                  <Detail
                    label="Rate per post"
                    value={
                      profile.rate_per_post
                        ? "₹" + profile.rate_per_post.toLocaleString("en-IN")
                        : null
                    }
                  />
                </>
              )}

              {role === "vendor" && (
                <>
                  <Detail label="Company" value={profile.company_name} />
                  <Detail label="GST" value={profile.gst_number} />
                  <Detail
                    label="Services"
                    value={
                      profile.services?.length
                        ? `${profile.services.length} listed`
                        : null
                    }
                  />
                  <Detail label="City" value={profile.city} />
                  <Detail
                    label="Rate card"
                    value={profile.rate_card ? "Added" : null}
                  />
                </>
              )}

              {role === "freelancer" && (
                <>
                  <Detail
                    label="Skills"
                    value={
                      profile.skills?.length
                        ? `${profile.skills.length} listed`
                        : null
                    }
                  />
                  <Detail
                    label="Portfolio"
                    value={profile.portfolio_url ? "Added" : null}
                  />
                  <Detail
                    label="Instagram"
                    value={
                      profile.instagram_id ? `@${profile.instagram_id}` : null
                    }
                  />
                  <Detail label="City" value={profile.city} />
                  <Detail
                    label="Rate card"
                    value={profile.rate_card ? "Added" : null}
                  />
                </>
              )}
            </View>
          </>
        )}

        {/* How it works — told in this role's language */}
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>

        <View style={styles.stepsCard}>
          {STEPS[role].map((step, i) => (
            <View key={step.t} style={[styles.step, i > 0 && styles.stepGap]}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
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

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, !value && styles.detailEmpty]}>
        {value || "Not set"}
      </Text>
    </View>
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
    fontSize: 22,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.white,
    letterSpacing: -0.5,
  },
  handle: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
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
    fontSize: 10.5,
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
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.white,
  },
  statusExplain: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    marginTop: 16,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textDark,
  },
  actionText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 2,
  },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textLight,
    letterSpacing: 0.9,
    marginTop: 28,
    marginBottom: 12,
  },

  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textMid,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textDark,
  },
  detailEmpty: {
    fontFamily: fonts.regular,
    color: colors.textLight,
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
    fontSize: 12,
    color: colors.white,
  },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.textDark,
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMid,
    marginTop: 2,
  },
});
