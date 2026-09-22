import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { saveProfile, uploadPhoto } from "../api/client";
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
import Chip from "../components/Chip";
import ScreenHeader from "../components/ScreenHeader";
import TrustPanel from "../components/TrustPanel";
import VerifySheet from "./VerifySheet";

/** Letters, numbers, dots and underscores — what Instagram allows */
const cleanHandle = (t: string) => t.replace(/[^a-zA-Z0-9._]/g, "");

/**
 * Two uses: the sign-up form (CreateProfile, where `role` and `onBack`
 * come from the navigator) and editing an existing profile (Profile).
 */
export default function ProfileScreen({
  role: roleProp,
  onBack,
}: {
  role?: Role;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, prefill, phone, refreshProfile, markSignedIn } = useAuth();

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

  /* Freelancer */
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url || "");
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);

  /* Vendor and freelancer both */
  const [rateCard, setRateCard] = useState(profile?.rate_card || "");

  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inFlight = useRef(false);

  const goBack = () => (isEditing ? navigation.goBack() : onBack?.());

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
  const hasCity = city.trim().length > 1;
  const roleReady =
    role === "influencer"
      ? instagram.trim().length > 1 &&
        !!category &&
        followers.trim().length > 0 &&
        hasCity &&
        Number(rate) > 0
      : role === "vendor"
        ? companyName.trim().length > 1 &&
          services.length > 0 &&
          gst.trim().length > 4 &&
          hasCity
        : skills.length > 0 && portfolio.trim().length > 4 && hasCity;

  const ready = !uploading && name.trim().length > 1 && roleReady;

  /**
   * The system photo picker needs no permission on Android 13+ or
   * iOS 14+, so we don't ask for one — asking would mean declaring
   * READ_MEDIA_IMAGES, which Google Play restricts.
   */
  const pickPhoto = async () => {
    if (uploading) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const previous = photo;
    const localUri = result.assets[0].uri;

    // Show it straight away, then swap in the uploaded URL
    setPhoto(localUri);
    setUploading(true);

    try {
      setPhoto(await uploadPhoto(localUri));
    } catch (err: any) {
      // Put back whatever they had, rather than wiping it
      setPhoto(previous);
      Alert.alert("Upload failed", err?.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /** The actual save — only runs once the number is verified */
  const doSave = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
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
              if (isEditing) navigation.goBack();
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert("Could not save", err?.message || "Please try again.");
    } finally {
      inFlight.current = false;
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
        <ScreenHeader
          title={isEditing ? "Edit profile" : `${meta.label} profile`}
          onBack={isEditing || onBack ? goBack : undefined}
        />

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
              style={[styles.roleBanner, { borderColor: tint(meta.accent, 0.25) }]}
            >
              <View
                style={[
                  styles.roleBannerIcon,
                  { backgroundColor: tint(meta.accent, 0.1) },
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
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={photo ? "Change photo" : "Add a photo"}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                accessibilityIgnoresInvertColors
              />
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
                {uploading
                  ? "Uploading…"
                  : photo
                    ? "Change photo"
                    : "Add a photo"}
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
            label="Full name *"
            value={name}
            onChangeText={setName}
            placeholder="As it appears on your ID"
            autoComplete="name"
            maxLength={80}
          />

          {/* ---------------- Creator ---------------- */}
          {role === "influencer" && (
            <>
              <Field
                label="Instagram handle *"
                prefix="@"
                value={instagram}
                onChangeText={(t) => setInstagram(cleanHandle(t))}
                placeholder="yourhandle"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                hint="We check this against your profile before approving"
              />

              <Text style={styles.groupLabel}>What do you post about? *</Text>
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
                    label="Followers *"
                    value={followers}
                    onChangeText={setFollowers}
                    placeholder="12.5K"
                    maxLength={20}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <CityField value={city} onChangeText={setCity} />
                </View>
              </View>

              <Field
                label="Rate per post *"
                prefix="₹"
                value={rate}
                onChangeText={(t) => setRate(t.replace(/[^0-9]/g, ""))}
                placeholder="5000"
                keyboardType="number-pad"
                maxLength={8}
                hint="What you charge for one sponsored post"
              />
            </>
          )}

          {/* ---------------- Vendor ---------------- */}
          {role === "vendor" && (
            <>
              <Field
                label="Company name *"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="As registered"
                maxLength={120}
              />

              <Text style={styles.groupLabel}>What do you offer? *</Text>
              <View style={styles.chipWrap}>
                {VENDOR_SERVICES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    active={services.includes(s)}
                    onPress={() => toggle(services, setServices, s)}
                  />
                ))}
              </View>

              <View style={[styles.row, { marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="GST number *"
                    value={gst}
                    onChangeText={(t) => setGst(t.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={15}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <CityField value={city} onChangeText={setCity} />
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
              <Text style={styles.groupLabel}>What do you do? *</Text>
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
                  label="Portfolio link *"
                  value={portfolio}
                  onChangeText={setPortfolio}
                  placeholder="Behance, Drive folder, Instagram, your site"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={300}
                  hint="Anything that shows your work — a Drive link is fine"
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Instagram"
                    prefix="@"
                    value={instagram}
                    onChangeText={(t) => setInstagram(cleanHandle(t))}
                    placeholder="optional"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <CityField value={city} onChangeText={setCity} />
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
            autoCorrect={false}
            autoComplete="email"
            maxLength={120}
            hint="Optional, but it's how we send briefs and anything in writing"
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

          <TrustPanel />
        </ScrollView>

        <VerifySheet
          visible={verifying}
          onClose={() => setVerifying(false)}
          onVerified={async () => {
            setVerifying(false);
            // Firebase has the number now — tell the context to re-read it
            markSignedIn();
            await doSave();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CityField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <Field
      label="City *"
      value={value}
      onChangeText={onChangeText}
      placeholder="Tirupati"
      autoCapitalize="words"
      maxLength={60}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
    fontSize: size.sm,
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
    fontSize: size.base,
    color: colors.textDark,
  },
  photoHint: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    marginTop: 2,
  },

  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textMid,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

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
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textMid,
  },

  note: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 14,
  },
});
