import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { saveProfile } from "../api/client";
import { hasVerifiedPhone } from "../lib/auth";
import {
  Role,
  roleMeta,
  VENDOR_SERVICES,
  FREELANCER_SKILLS,
  CREATOR_CATEGORIES,
} from "../data/roles";
import Field from "../components/Field";
import Button from "../components/Button";
import VerifySheet from "../screens/VerifySheet";

export default function ProfileScreen({
  navigation,
  role: roleProp,
  onBack,
}: any) {
  const insets = useSafeAreaInsets();
  const { profile, prefill, phone, refreshProfile } = useAuth();

  const isEditing = !!profile;

  /* Editing uses the saved role; creating uses what they picked */
  const role: Role = profile?.role || roleProp || "influencer";
  const meta = roleMeta(role);

  /* Shared */
  const [name, setName] = useState(profile?.name || prefill?.name || "");
  const [email, setEmail] = useState(profile?.email || prefill?.email || "");
  const [photo, setPhoto] = useState(
    profile?.photo_url || prefill?.photo || "",
  );
  const [city, setCity] = useState(profile?.city || "");
  const [bio, setBio] = useState(profile?.bio || "");

  /* Creator */
  const [instagram, setInstagram] = useState(profile?.instagram_id || "");
  const [followers, setFollowers] = useState(profile?.followers || "");
  const [category, setCategory] = useState(profile?.category || "");
  const [rate, setRate] = useState(
    profile?.rate_per_post ? String(profile.rate_per_post) : "",
  );

  /* Vendor */
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [gst, setGst] = useState(profile?.gst_number || "");
  const [services, setServices] = useState<string[]>(profile?.services || []);
  const [otherService, setOtherService] = useState(
    profile?.other_service || "",
  );
  const [showOther, setShowOther] = useState(!!profile?.other_service);

  /* Freelancer */
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url || "");
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);

  /* Vendor and freelancer both */
  const [rateCard, setRateCard] = useState(profile?.rate_card || "");

  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) => {
    setList(
      list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    );
  };

  /* What each role must fill in before Submit lights up */
  const ready =
    name.trim().length > 1 &&
    (role === "influencer"
      ? instagram.trim().length > 1 && !!category
      : role === "vendor"
        ? companyName.trim().length > 1 &&
          (services.length > 0 || otherService.trim().length > 1)
        : skills.length > 0);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access so you can set your picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  /** The actual save — only runs once the number is verified */
  const doSave = async () => {
    setBusy(true);

    try {
      await saveProfile({
        role,
        name: name.trim(),
        email: email.trim() || undefined,
        photoUrl: photo || undefined,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,

        instagramId:
          role === "freelancer" || role === "influencer"
            ? instagram.trim().replace(/^@/, "") || undefined
            : undefined,
        followers:
          role === "influencer" ? followers.trim() || undefined : undefined,
        category: role === "influencer" ? category || undefined : undefined,
        ratePerPost: role === "influencer" && rate ? Number(rate) : undefined,

        companyName: role === "vendor" ? companyName.trim() : undefined,
        gstNumber: role === "vendor" ? gst.trim() || undefined : undefined,
        services: role === "vendor" ? services : undefined,
        otherService:
          role === "vendor" ? otherService.trim() || undefined : undefined,

        portfolioUrl:
          role === "freelancer" ? portfolio.trim() || undefined : undefined,
        skills: role === "freelancer" ? skills : undefined,

        rateCard:
          role !== "influencer" ? rateCard.trim() || undefined : undefined,
      });

      await refreshProfile();

      Alert.alert(
        isEditing ? "Profile updated" : "Profile submitted",
        isEditing
          ? "Our team will review the changes shortly."
          : "We'll review your profile and get back to you within a day or two.",
        [
          {
            text: "OK",
            onPress: () => {
              if (isEditing) navigation?.goBack?.();
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert("Could not save", err?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => {
    if (!ready || busy) return;

    // The backend identifies every partner by their verified number
    if (!hasVerifiedPhone()) {
      setVerifying(true);
      return;
    }

    doSave();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {isEditing || onBack ? (
            <TouchableOpacity
              style={styles.back}
              onPress={() => (isEditing ? navigation.goBack() : onBack?.())}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={colors.textDark}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <Text style={styles.headerTitle}>
            {isEditing ? "Edit profile" : `${meta.label} profile`}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 40 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditing && (
            <View
              style={[styles.roleBanner, { borderColor: `${meta.accent}40` }]}
            >
              <View
                style={[
                  styles.roleBannerIcon,
                  { backgroundColor: `${meta.accent}1A` },
                ]}
              >
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={20}
                  color={meta.accent}
                />
              </View>
              <Text style={styles.roleBannerText}>
                Signing up as a {meta.label.toLowerCase()}. Our team reviews
                every profile before it goes live.
              </Text>
            </View>
          )}

          {/* Photo */}
          <TouchableOpacity
            style={styles.photoRow}
            activeOpacity={0.85}
            onPress={pickPhoto}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoEmpty]}>
                <MaterialCommunityIcons
                  name="camera-plus-outline"
                  size={24}
                  color={colors.textLight}
                />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>
                {photo ? "Change photo" : "Add a photo"}
              </Text>
              <Text style={styles.photoHint}>
                {role === "vendor"
                  ? "Your logo works well here"
                  : "A clear headshot works best"}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="As it appears on your ID"
          />

          {/* ---------------- Creator ---------------- */}
          {role === "influencer" && (
            <>
              <Field
                label="Instagram handle"
                prefix="@"
                value={instagram}
                onChangeText={(t) =>
                  setInstagram(t.replace(/[^a-zA-Z0-9._]/g, ""))
                }
                placeholder="yourhandle"
                autoCapitalize="none"
                autoCorrect={false}
                hint="We check this against your profile before approving"
              />

              <Text style={styles.groupLabel}>What do you post about?</Text>
              <View style={styles.chipWrap}>
                {CREATOR_CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <Chip
                      key={c}
                      label={c}
                      active={active}
                      onPress={() => setCategory(active ? "" : c)}
                    />
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Followers"
                    value={followers}
                    onChangeText={setFollowers}
                    placeholder="12.5K"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Tirupati"
                  />
                </View>
              </View>

              <Field
                label="Rate per post"
                prefix="₹"
                value={rate}
                onChangeText={(t) => setRate(t.replace(/[^0-9]/g, ""))}
                placeholder="5000"
                keyboardType="number-pad"
                hint="What you charge for one sponsored post"
              />
            </>
          )}

          {/* ---------------- Vendor ---------------- */}
          {role === "vendor" && (
            <>
              <Field
                label="Company name"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="As registered"
              />

              <Text style={styles.groupLabel}>What do you offer?</Text>
              <View style={styles.chipWrap}>
                {VENDOR_SERVICES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={services.includes(s)}
                    onPress={() => toggle(services, setServices, s)}
                  />
                ))}

                <Chip
                  label="Other"
                  active={showOther}
                  onPress={() => {
                    setShowOther(!showOther);
                    if (showOther) setOtherService("");
                  }}
                />
              </View>

              {showOther && (
                <View style={styles.otherBox}>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={17}
                    color={colors.primary}
                  />
                  <TextInput
                    style={styles.otherInput}
                    placeholder="What else do you do?"
                    placeholderTextColor={colors.textLight}
                    value={otherService}
                    onChangeText={setOtherService}
                    maxLength={60}
                    autoFocus
                  />
                </View>
              )}

              <View style={[styles.row, { marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="GST number"
                    value={gst}
                    onChangeText={(t) => setGst(t.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    autoCapitalize="characters"
                    maxLength={15}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Tirupati"
                  />
                </View>
              </View>

              <Field
                label="Rate card"
                value={rateCard}
                onChangeText={setRateCard}
                placeholder="e.g. Hoarding 20x10 — ₹18,000/month. Printing at ₹12/sqft."
                multiline
                maxLength={500}
                hint="Rough pricing helps our team quote faster"
              />
            </>
          )}

          {/* ---------------- Freelancer ---------------- */}
          {role === "freelancer" && (
            <>
              <Text style={styles.groupLabel}>What do you do?</Text>
              <View style={styles.chipWrap}>
                {FREELANCER_SKILLS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={skills.includes(s)}
                    onPress={() => toggle(skills, setSkills, s)}
                  />
                ))}
              </View>

              <View style={{ marginTop: 20 }}>
                <Field
                  label="Portfolio link"
                  value={portfolio}
                  onChangeText={setPortfolio}
                  placeholder="Behance, Drive, or your own site"
                  autoCapitalize="none"
                  autoCorrect={false}
                  hint="Anything that shows your work"
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Instagram"
                    prefix="@"
                    value={instagram}
                    onChangeText={(t) =>
                      setInstagram(t.replace(/[^a-zA-Z0-9._]/g, ""))
                    }
                    placeholder="optional"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Tirupati"
                  />
                </View>
              </View>

              <Field
                label="Rate card"
                value={rateCard}
                onChangeText={setRateCard}
                placeholder="e.g. Logo design ₹6,000. Reel editing ₹1,500 each."
                multiline
                maxLength={500}
                hint="Rough pricing helps our team quote faster"
              />
            </>
          )}

          {/* ---------------- Shared tail ---------------- */}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Field
            label={role === "vendor" ? "About the company" : "About you"}
            value={bio}
            onChangeText={setBio}
            placeholder={
              role === "vendor"
                ? "How long have you been operating, and where?"
                : "A line or two about your work and audience"
            }
            multiline
            maxLength={500}
          />

          <View style={styles.lockedRow}>
            <MaterialCommunityIcons
              name={phone ? "shield-check" : "shield-outline"}
              size={17}
              color={phone ? colors.success : colors.textLight}
            />
            <Text style={styles.lockedText}>
              {phone
                ? `Verified number: +91 ${phone}`
                : "We'll verify your number when you submit"}
            </Text>
          </View>

          <Button
            label={isEditing ? "Save changes" : "Submit for review"}
            onPress={handleSave}
            disabled={!ready}
            busy={busy}
            style={{ marginTop: 20 }}
          />

          {isEditing && (
            <Text style={styles.note}>
              Editing your profile sends it back for review
            </Text>
          )}
        </ScrollView>

        <VerifySheet
          visible={verifying}
          onClose={() => setVerifying(false)}
          onVerified={async () => {
            setVerifying(false);
            await doSave();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Pieces ---------- */

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textDark,
    letterSpacing: -0.3,
  },

  content: { padding: 20 },

  roleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  roleBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  roleBannerText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMid,
  },

  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  photo: { width: 58, height: 58, borderRadius: 29 },
  photoEmpty: {
    backgroundColor: colors.surfaceDeep,
    justifyContent: "center",
    alignItems: "center",
  },
  photoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textDark,
  },
  photoHint: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 2,
  },

  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
  },
  chipTextActive: { color: colors.white, fontFamily: fonts.semibold },

  otherBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
    marginTop: 12,
  },
  otherInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
  },

  row: { flexDirection: "row", marginTop: 20 },

  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 13,
    marginTop: 4,
  },
  lockedText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
  },

  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 14,
  },
});
