import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { fetchMyRequests, sendRequest, CreatorRequest } from "../api/client";
import Button from "../components/Button";

const TYPES = [
  { key: "payment", label: "Payment", icon: "cash-multiple" },
  { key: "profile", label: "Profile", icon: "account-edit-outline" },
  { key: "availability", label: "Availability", icon: "calendar-outline" },
  { key: "general", label: "Something else", icon: "help-circle-outline" },
];

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: "Sent", color: colors.textMid },
  contacted: { label: "Seen", color: colors.warning },
  in_progress: { label: "Working on it", color: colors.primary },
  closed: { label: "Resolved", color: colors.success },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [items, setItems] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Compose */
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchMyRequests();
      setItems(data);
    } catch {
      // Leave whatever's on screen
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profile) load();
      else setLoading(false);
    }, [load, profile]),
  );

  const submit = async () => {
    if (message.trim().length < 5 || sending) return;

    setSending(true);

    try {
      await sendRequest({
        type,
        subject: TYPES.find((t) => t.key === type)?.label,
        message: message.trim(),
      });

      setOpen(false);
      setMessage("");
      setType("general");
      load();
    } catch (err: any) {
      Alert.alert("Could not send", err?.message || "Please try again.");
    } finally {
      setSending(false);
    }
  };

  /* No profile yet — nothing to raise a request about */
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Support</Text>
        </View>

        <View style={styles.blocked}>
          <View style={styles.blockedIcon}>
            <MaterialCommunityIcons
              name="account-question-outline"
              size={28}
              color={colors.textLight}
            />
          </View>
          <Text style={styles.blockedTitle}>Create your profile first</Text>
          <Text style={styles.blockedText}>
            Once you've submitted your details you can reach our team here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
        <TouchableOpacity
          style={styles.newButton}
          activeOpacity={0.85}
          onPress={() => setOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={17} color={colors.white} />
          <Text style={styles.newText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 30 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const s = STATUS[item.status] || STATUS.new;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardSubject}>
                    {item.subject || "Request"}
                  </Text>
                  <View style={styles.statusPill}>
                    <View
                      style={[styles.statusDot, { backgroundColor: s.color }]}
                    />
                    <Text style={[styles.statusText, { color: s.color }]}>
                      {s.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.blockedIcon}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={26}
                  color={colors.textLight}
                />
              </View>
              <Text style={styles.blockedTitle}>Nothing yet</Text>
              <Text style={styles.blockedText}>
                Question about a payment, your profile, or anything else? Send
                it here and our team picks it up.
              </Text>
            </View>
          }
        />
      )}

      {/* Compose */}
      <Modal visible={open} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            <Text style={styles.sheetTitle}>What's this about?</Text>

            <View style={styles.typeWrap}>
              {TYPES.map((t) => {
                const active = type === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    activeOpacity={0.85}
                    onPress={() => setType(t.key)}
                  >
                    <MaterialCommunityIcons
                      name={t.icon as any}
                      size={15}
                      color={active ? colors.white : colors.textMid}
                    />
                    <Text
                      style={[styles.typeText, active && styles.typeTextActive]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.messageBox}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what you need…"
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              editable={!sending}
            />

            <Button
              label="Send"
              onPress={submit}
              disabled={message.trim().length < 5}
              busy={sending}
              style={{ marginTop: 16 }}
            />

            <TouchableOpacity
              style={styles.cancel}
              onPress={() => setOpen(false)}
              disabled={sending}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.white,
  },

  centre: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, gap: 10 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardSubject: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.textDark,
  },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: fonts.semibold, fontSize: 11.5 },
  cardMessage: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
  },
  cardTime: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textLight,
    marginTop: 10,
  },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 30 },
  blocked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  blockedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  blockedTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 7,
  },
  blockedText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
    textAlign: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,10,31,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textDark,
    letterSpacing: -0.5,
    marginBottom: 16,
  },

  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
  },
  typeTextActive: { color: colors.white, fontFamily: fonts.semibold },

  messageBox: {
    height: 130,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textDark,
  },

  cancel: { alignItems: "center", paddingVertical: 16 },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textLight,
  },
});
