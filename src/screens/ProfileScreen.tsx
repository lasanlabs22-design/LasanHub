import React, { useState } from "react";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { saveProfile } from "../api/client";
import Field from "../components/Field";
import Button from "../components/Button";

const CATEGORIES = [
  "Fashion",
  "Food",
  "Fitness",
  "Beauty",
  "Travel",
  "Comedy",
  "Tech",
  "Lifestyle",
  "City page",
  "Anchor",
  "Dance",
  "Other",
];

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile, prefill, phone, refreshProfile } = useAuth();

  const isEditing = !!profile;

  const [name, setName] = useState(profile?.name || prefill?.name || "");
  const [email, setEmail] = useState(profile?.email || prefill?.email || "");
  const [photo, setPhoto] = useState(
    profile?.photo_url || prefill?.photo || "",
  );
  const [instagram, setInstagram] = useState(profile?.instagram_id || "");
  const [followers, setFollowers] = useState(profile?.followers || "");
  const [category, setCategory] = useState(profile?.category || "");
  const [city, setCity] = useState(profile?.city || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [rate, setRate] = useState(
    profile?.rate_per_post ? String(profile.rate_per_post) : "",
  );

  const [busy, setBusy] = useState(false);

  const ready =
    name.trim().length > 1 && instagram.trim().length > 1 && !!category;

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

  const handleSave = async () => {
    if (!ready || busy) return;

    setBusy(true);

    try {
      await saveProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        photoUrl: photo || undefined,
        instagramId: instagram.trim().replace(/^@/, ""),
        followers: followers.trim() || undefined,
        category,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        ratePerPost: rate ? Number(rate) : undefined,
      });

      await refreshProfile();

      Alert.alert(
        isEditing ? "Profile updated" : "Profile submitted",
        isEditing
          ? "Our team will review the changes shortly."
          : "We'll review your profile and get back to you within a day or two.",
        [{ text: "OK", onPress: () => navigation?.goBack?.() }],
      );
    } catch (err: any) {
      Alert.alert("Could not save", err?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {isEditing && (
            <TouchableOpacity
              style={styles.back}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={colors.textDark}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit profile" : "Create your profile"}
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
            <Text style={styles.intro}>
              Tell us about yourself. Our team reviews every profile before it
              goes live to businesses.
            </Text>
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
              <Text style={styles.photoHint}>A clear headshot works best</Text>
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

          <Field
            label="Instagram handle"
            prefix="@"
            value={instagram}
            onChangeText={(t) => setInstagram(t.replace(/[^a-zA-Z0-9._]/g, ""))}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect={false}
            hint="We check this against your profile before approving"
          />

          {/* Category */}
          <Text style={styles.groupLabel}>What do you post about?</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                  onPress={() => setCategory(active ? "" : c)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
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

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Field
            label="About you"
            value={bio}
            onChangeText={setBio}
            placeholder="A line or two about your content and audience"
            multiline
            maxLength={500}
          />

          {/* Phone is fixed — it's how they signed in */}
          <View style={styles.lockedRow}>
            <MaterialCommunityIcons
              name="shield-check"
              size={17}
              color={colors.success}
            />
            <Text style={styles.lockedText}>Verified number: +91 {phone}</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  intro: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textMid,
    marginBottom: 24,
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
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },
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

  row: { flexDirection: "row" },

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
