import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { fetchMyRequests, sendRequest, CreatorRequest } from "../api/client";
import { timeAgo } from "../lib/time";
import Button from "../components/Button";
import Chip from "../components/Chip";
import BottomSheet from "../components/BottomSheet";
import EmptyState from "../components/EmptyState";
import { TabHeader } from "../components/ScreenHeader";

/** Keys must match the API's VALID_REQUEST_TYPES */
const TYPES = [
  { key: "payment", label: "Payment", icon: "cash-multiple" },
  { key: "profile", label: "Profile", icon: "account-edit-outline" },
  { key: "availability", label: "Availability", icon: "calendar-outline" },
  { key: "general", label: "Something else", icon: "help-circle-outline" },
];

/** Keys match the statuses the admin console sets */
const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: "Sent", color: colors.textMid },
  contacted: { label: "Seen", color: colors.warningText },
  in_progress: { label: "Working on it", color: colors.primary },
  closed: { label: "Resolved", color: colors.successText },
};

const MIN_MESSAGE = 5;

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [items, setItems] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  /* Compose */
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);

    try {
      setItems(await fetchMyRequests());
      hasLoaded.current = true;
    } catch {
      // Leave whatever's on screen
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const closeCompose = () => {
    setOpen(false);
    setMessage("");
    setType("general");
  };

  const submit = async () => {
    if (message.trim().length < MIN_MESSAGE || inFlight.current) return;

    inFlight.current = true;
    setSending(true);

    try {
      await sendRequest({
        type,
        subject: TYPES.find((t) => t.key === type)?.label,
        message: message.trim(),
      });

      closeCompose();
      load();
    } catch (err: any) {
      Alert.alert("Could not send", err?.message || "Please try again.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  // Tabs only mount once a profile exists
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TabHeader
        title="Support"
        right={
          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.85}
            hitSlop={6}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="New support request"
          >
            <MaterialCommunityIcons name="plus" size={17} color={colors.white} />
            <Text style={styles.newText}>New</Text>
          </TouchableOpacity>
        }
      />

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
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const s = STATUS[item.status] || STATUS.new;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardSubject} numberOfLines={1}>
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
            <EmptyState
              icon="message-text-outline"
              title="Nothing yet"
              text="Question about a payment, your profile, or anything else? Send it here and our team picks it up."
            />
          }
        />
      )}

      {/* Compose */}
      <BottomSheet
        visible={open}
        title="What's this about?"
        onClose={closeCompose}
        closeDisabled={sending}
      >
        <View style={styles.typeWrap}>
          {TYPES.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              icon={t.icon}
              active={type === t.key}
              onPress={() => setType(t.key)}
              disabled={sending}
            />
          ))}
        </View>

        <TextInput
          style={styles.messageBox}
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what you need…"
          placeholderTextColor={colors.textLight}
          accessibilityLabel="Your message"
          multiline
          maxLength={1000}
          textAlignVertical="top"
          editable={!sending}
        />

        <Button
          label="Send"
          onPress={submit}
          disabled={message.trim().length < MIN_MESSAGE}
          busy={sending}
          style={{ marginTop: 16 }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 40,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
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
    gap: 10,
    marginBottom: 8,
  },
  cardSubject: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: size.base,
    color: colors.textDark,
  },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.semibold, fontSize: size.xs },
  cardMessage: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.textMid,
  },
  cardTime: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    marginTop: 10,
  },

  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  messageBox: {
    minHeight: 130,
    maxHeight: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: size.base,
    lineHeight: 21,
    color: colors.textDark,
  },
});
