import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { roleMeta } from "../data/roles";
import { sendRequest } from "../api/client";
import { messageSupport, openPrivacyPolicy } from "../lib/support";
import { APP_VERSION } from "../config";
import { TabHeader } from "../components/ScreenHeader";
import type { RootNavigation } from "../navigation/types";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { profile, phone, signOut } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const inFlight = useRef(false);

  // Tabs only mount once a profile exists
  if (!profile) return null;

  const meta = roleMeta(profile.role);
  const shownPhone = phone || profile.phone;

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in with your number anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  /**
   * Sent as a support request, so it lands in the admin console's Hub
   * queue with the partner's name and number attached. The team removes
   * the profile from there — the 30 days the trust panel promises.
   */
  const requestDeletion = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setDeleting(true);

    try {
      await sendRequest({
        type: "profile",
        subject: "Delete my account",
        message:
          "Please delete my Lasan Hub account and everything attached to it.",
      });

      Alert.alert(
        "Request sent",
        "Our team will remove your profile and everything attached to it within 30 days. You can follow it in the Support tab.",
      );
    } catch (err: any) {
      Alert.alert("Could not send", err?.message || "Please try again.");
    } finally {
      inFlight.current = false;
      setDeleting(false);
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      "Delete your account?",
      "We'll remove your profile, your work history and everything else we hold about you. This can't be undone.",
      [
        { text: "Keep my account", style: "cancel" },
        {
          text: "Request deletion",
          style: "destructive",
          onPress: requestDeletion,
        },
      ],
    );
  };

  /* The tags themselves, since a count isn't much use */
  const tags = [
    ...(profile.services || []),
    ...(profile.skills || []),
    ...(profile.other_service ? [profile.other_service] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TabHeader
        title="Account"
        right={
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            hitSlop={6}
            onPress={() => navigation.navigate("Profile")}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={15}
              color={colors.primary}
            />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Who they are */}
        <View style={styles.identity}>
          {profile.photo_url ? (
            <Image
              source={{ uri: profile.photo_url }}
              style={styles.photo}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.photo, { backgroundColor: meta.accent }]}>
              <Text style={styles.photoLetter}>
                {(profile.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name}
            </Text>

            <View
              style={[styles.rolePill, { backgroundColor: tint(meta.accent, 0.1) }]}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={12}
                color={meta.accent}
              />
              <Text style={[styles.roleText, { color: colors.textDark }]}>
                {meta.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <SectionLabel>CONTACT</SectionLabel>

        <View style={styles.card}>
          <Row
            icon="phone-outline"
            label="Mobile"
            value={shownPhone ? `+91 ${shownPhone}` : null}
          />
          <Row icon="email-outline" label="Email" value={profile.email} />
          <Row
            icon="map-marker-outline"
            label="City"
            value={profile.city}
            last
          />
        </View>

        {/* What they do — different per role */}
        <SectionLabel>
          {profile.role === "vendor" ? "YOUR BUSINESS" : "YOUR WORK"}
        </SectionLabel>

        <View style={styles.card}>
          {profile.role === "influencer" && (
            <>
              <Row
                icon="instagram"
                label="Instagram"
                value={profile.instagram_id ? `@${profile.instagram_id}` : null}
              />
              <Row
                icon="tag-outline"
                label="Posts about"
                value={profile.category}
              />
              <Row
                icon="account-group-outline"
                label="Followers"
                value={profile.followers}
              />
              <Row
                icon="currency-inr"
                label="Rate per post"
                value={
                  profile.rate_per_post
                    ? "₹" + profile.rate_per_post.toLocaleString("en-IN")
                    : null
                }
                last
              />
            </>
          )}

          {profile.role === "vendor" && (
            <>
              <Row
                icon="office-building-outline"
                label="Company"
                value={profile.company_name}
              />
              <Row
                icon="file-document-outline"
                label="GST"
                value={profile.gst_number}
              />
              <Row
                icon="clipboard-list-outline"
                label="Services"
                value={
                  profile.services?.length
                    ? `${profile.services.length} listed`
                    : null
                }
              />
              <Row
                icon="currency-inr"
                label="Rate card"
                value={profile.rate_card ? "Added" : null}
                last
              />
            </>
          )}

          {profile.role === "freelancer" && (
            <>
              <Row
                icon="palette-outline"
                label="Skills"
                value={
                  profile.skills?.length
                    ? `${profile.skills.length} listed`
                    : null
                }
              />
              <Row
                icon="link-variant"
                label="Portfolio"
                value={profile.portfolio_url ? "Added" : null}
              />
              <Row
                icon="instagram"
                label="Instagram"
                value={profile.instagram_id ? `@${profile.instagram_id}` : null}
              />
              <Row
                icon="currency-inr"
                label="Rate card"
                value={profile.rate_card ? "Added" : null}
                last
              />
            </>
          )}
        </View>

        {tags.length > 0 && (
          <View style={styles.tagWrap}>
            {tags.map((t) => (
              <View
                key={t}
                style={[styles.tag, { backgroundColor: tint(meta.accent, 0.07) }]}
              >
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Help */}
        <SectionLabel>HELP</SectionLabel>

        <View style={styles.actions}>
          <ActionRow
            icon="help-circle-outline"
            iconColor={colors.primary}
            iconBg={colors.primarySoft}
            title="Common questions"
            text="Approval, work, payments and your account"
            onPress={() => navigation.navigate("Faq")}
          />
          <ActionRow
            icon="whatsapp"
            iconColor={colors.successText}
            iconBg={colors.successSoft}
            title="Message our team"
            text="Usually replies within a few hours"
            onPress={messageSupport}
          />
        </View>

        {/* About */}
        <SectionLabel>ABOUT</SectionLabel>

        <View style={styles.card}>
          <Row icon="information-outline" label="Version" value={APP_VERSION} />
          <TouchableOpacity
            onPress={openPrivacyPolicy}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Privacy policy, opens lasanmart.com"
          >
            <Row
              icon="shield-check-outline"
              label="Privacy policy"
              value="lasanmart.com/privacy"
              link
              last
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOut}
          activeOpacity={0.85}
          onPress={confirmSignOut}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="logout"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteRow}
          activeOpacity={0.7}
          onPress={confirmDeletion}
          disabled={deleting}
          accessibilityRole="button"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.textLight} />
          ) : (
            <Text style={styles.deleteText}>Delete my account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>Lasan Hub · Lasan Media Works</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel} accessibilityRole="header">
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  value,
  link,
  last,
}: {
  icon: string;
  label: string;
  value: string | null;
  link?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={colors.textLight}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          !value && styles.rowEmpty,
          link && styles.rowLink,
        ]}
        numberOfLines={1}
      >
        {value || "Not set"}
      </Text>
      {link && (
        <MaterialCommunityIcons
          name="open-in-new"
          size={14}
          color={colors.primary}
        />
      )}
    </View>
  );
}

function ActionRow({
  icon,
  iconColor,
  iconBg,
  title,
  text,
  onPress,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionText}>{text}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textLight}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 40,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editText: {
    fontFamily: fonts.semibold,
    fontSize: size.sm,
    color: colors.primary,
  },

  content: { padding: 20, paddingTop: 4 },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  photoLetter: {
    fontFamily: fonts.bold,
    fontSize: size.h1,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: size.h3,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 5,
  },
  roleText: { fontFamily: fonts.semibold, fontSize: size.xxs },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: size.xxs,
    color: colors.textLight,
    letterSpacing: 0.9,
    marginTop: 26,
    marginBottom: 12,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 50,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    color: colors.textMid,
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.textDark,
    maxWidth: "52%",
    textAlign: "right",
  },
  rowEmpty: { fontFamily: fonts.regular, color: colors.textLight },
  rowLink: { color: colors.primary },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  tag: {
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textDark,
  },

  actions: { gap: 10 },
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
    fontSize: size.base,
    color: colors.textDark,
  },
  actionText: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    marginTop: 2,
  },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 30,
    minHeight: 48,
    paddingVertical: 14,
  },
  signOutText: {
    fontFamily: fonts.semibold,
    fontSize: size.base,
    color: colors.danger,
  },

  deleteRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 10,
  },
  deleteText: {
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textLight,
    textDecorationLine: "underline",
  },

  footer: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 10,
  },
});
