import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { roleMeta, Role } from "../data/roles";

const SUPPORT_PHONE = "8309074248";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { profile, phone, signOut } = useAuth();

  const role: Role = profile?.role || "influencer";
  const meta = roleMeta(role);

  const phoneLine = phone
    ? `+91 ${phone}`
    : profile?.phone
      ? `+91 ${profile.phone}`
      : "—";

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

        {profile && (
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Profile")}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={15}
              color={colors.primary}
            />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Who they are */}
        {profile && (
          <View style={styles.identity}>
            {profile.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, { backgroundColor: meta.accent }]}>
                <Text style={styles.photoLetter}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>

              <View
                style={[
                  styles.rolePill,
                  { backgroundColor: `${meta.accent}1A` },
                ]}
              >
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={11}
                  color={meta.accent}
                />
                <Text style={[styles.roleText, { color: meta.accent }]}>
                  {meta.label}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Contact */}
        <Text style={styles.sectionLabel}>CONTACT</Text>

        <View style={styles.card}>
          <Row icon="phone-outline" label="Mobile" value={phoneLine} />
          <Row
            icon="email-outline"
            label="Email"
            value={profile?.email || null}
          />
          <Row
            icon="map-marker-outline"
            label="City"
            value={profile?.city || null}
          />
        </View>

        {/* What they do — different per role */}
        {profile && (
          <>
            <Text style={styles.sectionLabel}>
              {role === "vendor" ? "YOUR BUSINESS" : "YOUR WORK"}
            </Text>

            <View style={styles.card}>
              {role === "influencer" && (
                <>
                  <Row
                    icon="instagram"
                    label="Instagram"
                    value={
                      profile.instagram_id ? `@${profile.instagram_id}` : null
                    }
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
                  />
                </>
              )}

              {role === "vendor" && (
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
                  />
                </>
              )}

              {role === "freelancer" && (
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
                    value={
                      profile.instagram_id ? `@${profile.instagram_id}` : null
                    }
                  />
                  <Row
                    icon="currency-inr"
                    label="Rate card"
                    value={profile.rate_card ? "Added" : null}
                  />
                </>
              )}
            </View>

            {/* The tags themselves, since a count isn't much use */}
            {(profile.services?.length || profile.skills?.length) && (
              <View style={styles.tagWrap}>
                {[...(profile.services || []), ...(profile.skills || [])].map(
                  (t) => (
                    <View
                      key={t}
                      style={[
                        styles.tag,
                        { backgroundColor: `${meta.accent}12` },
                      ]}
                    >
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ),
                )}

                {profile.other_service && (
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: `${meta.accent}12` },
                    ]}
                  >
                    <Text style={styles.tagText}>{profile.other_service}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Help */}
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

        {/* About */}
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
  value: string | null;
}) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={colors.textLight}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, !value && styles.rowEmpty]}
        numberOfLines={1}
      >
        {value || "Not set"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textDark,
    letterSpacing: -0.6,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  editText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
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
    fontSize: 24,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
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
  roleText: { fontFamily: fonts.semibold, fontSize: 11 },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
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
    maxWidth: "52%",
    textAlign: "right",
  },
  rowEmpty: { fontFamily: fonts.regular, color: colors.textLight },

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
    fontSize: 12.5,
    color: colors.textDark,
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
