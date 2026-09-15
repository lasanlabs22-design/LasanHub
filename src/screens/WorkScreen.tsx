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
import { fetchMyWork, updateJob, AssignedJob } from "../api/client";
import Button from "../components/Button";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  offered: {
    label: "New offer",
    color: "#E8A400",
    bg: "rgba(232,164,0,0.12)",
  },
  accepted: {
    label: "Accepted",
    color: "#0EA97A",
    bg: "rgba(14,169,122,0.12)",
  },
  in_progress: {
    label: "In progress",
    color: "#5F259F",
    bg: "rgba(95,37,159,0.12)",
  },
  completed: {
    label: "Completed",
    color: "#0EA97A",
    bg: "rgba(14,169,122,0.12)",
  },
  declined: {
    label: "Declined",
    color: "#918CA3",
    bg: "rgba(145,140,163,0.12)",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "#918CA3",
    bg: "rgba(145,140,163,0.12)",
  },
};

function timeAgo(iso: string): string {
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

export default function WorkScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  /* Declining needs a reason, so it gets a sheet */
  const [declining, setDeclining] = useState<AssignedJob | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchMyWork();
      setJobs(data);
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

  const change = async (
    job: AssignedJob,
    status: string,
    extra?: { reason?: string },
  ) => {
    setBusyId(job.id);

    try {
      await updateJob(job.id, { status, ...extra });
      setDeclining(null);
      setReason("");
      await load();
    } catch (err: any) {
      Alert.alert("Could not update", err?.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmComplete = (job: AssignedJob) => {
    Alert.alert(
      "Mark as complete?",
      "We'll let the client know and check they're happy with it.",
      [
        { text: "Not yet", style: "cancel" },
        { text: "Yes, done", onPress: () => change(job, "completed") },
      ],
    );
  };

  /* ---------- No profile yet ---------- */
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Work</Text>
        </View>

        <View style={styles.blocked}>
          <View style={styles.blockedIcon}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={28}
              color={colors.textLight}
            />
          </View>
          <Text style={styles.blockedTitle}>Create your profile first</Text>
          <Text style={styles.blockedText}>
            Once you're approved, work we send your way appears here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const open = jobs.filter((j) =>
    ["offered", "accepted", "in_progress"].includes(j.status),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Work</Text>
        {open.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{open.length} open</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
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
            const s = STATUS[item.status] || STATUS.offered;
            const busy = busyId === item.id;
            const service = item.details?.service;

            return (
              <View
                style={[
                  styles.card,
                  item.status === "offered" && styles.cardNew,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title || service || "Marketing work"}
                    </Text>

                    <View style={styles.metaRow}>
                      {service && <Text style={styles.meta}>{service}</Text>}
                      {item.city && (
                        <Text style={styles.meta}>· {item.city}</Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>
                      {s.label}
                    </Text>
                  </View>
                </View>

                {/* The brief our team wrote, or the request itself */}
                {(item.brief || item.description) && (
                  <Text style={styles.brief} numberOfLines={4}>
                    {item.brief || item.description}
                  </Text>
                )}

                {/* Budget and timing, if the client gave them */}
                {(item.details?.budget || item.details?.timeline) && (
                  <View style={styles.detailRow}>
                    {item.details?.budget && (
                      <Detail label="Budget" value={item.details.budget} />
                    )}
                    {item.details?.timeline && (
                      <Detail label="Timeline" value={item.details.timeline} />
                    )}
                  </View>
                )}

                <View style={styles.footRow}>
                  <Text style={styles.client}>For {item.customer_name}</Text>
                  <Text style={styles.time}>{timeAgo(item.assigned_at)}</Text>
                </View>

                {/* Actions, by state */}
                {item.status === "offered" && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        setDeclining(item);
                        setReason("");
                      }}
                      disabled={busy}
                    >
                      <Text style={styles.declineText}>Can't take it</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptButton}
                      activeOpacity={0.9}
                      onPress={() => change(item, "accepted")}
                      disabled={busy}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.acceptText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === "accepted" && (
                  <TouchableOpacity
                    style={styles.singleButton}
                    activeOpacity={0.9}
                    onPress={() => change(item, "in_progress")}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.acceptText}>Start work</Text>
                    )}
                  </TouchableOpacity>
                )}

                {item.status === "in_progress" && (
                  <TouchableOpacity
                    style={[
                      styles.singleButton,
                      { backgroundColor: colors.success },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => confirmComplete(item)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.acceptText}>Mark complete</Text>
                    )}
                  </TouchableOpacity>
                )}

                {item.status === "declined" && item.decline_reason && (
                  <Text style={styles.declineNote}>
                    You said: {item.decline_reason}
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.blockedIcon}>
                <MaterialCommunityIcons
                  name="briefcase-clock-outline"
                  size={26}
                  color={colors.textLight}
                />
              </View>
              <Text style={styles.blockedTitle}>No work yet</Text>
              <Text style={styles.blockedText}>
                {profile.status === "approved"
                  ? "You're live. When a client needs what you offer, it'll appear here."
                  : "Once your profile is approved, work we send your way appears here."}
              </Text>
            </View>
          }
        />
      )}

      {/* Declining — we ask why, so we can place it properly elsewhere */}
      <Modal visible={!!declining} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            <Text style={styles.sheetTitle}>Why can't you take it?</Text>
            <Text style={styles.sheetBody}>
              No penalty for declining — it just helps us find someone else
              quickly.
            </Text>

            <View style={styles.quickWrap}>
              {[
                "Too busy right now",
                "Outside my area",
                "Budget too low",
                "Not my kind of work",
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.quickChip,
                    reason === r && styles.quickChipActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setReason(r)}
                >
                  <Text
                    style={[
                      styles.quickText,
                      reason === r && styles.quickTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reasonBox}
              value={reason}
              onChangeText={setReason}
              placeholder="Or tell us in your own words"
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />

            <Button
              label="Send"
              onPress={() =>
                declining &&
                change(declining, "declined", { reason: reason.trim() })
              }
              disabled={reason.trim().length < 3}
              busy={busyId === declining?.id}
              style={{ marginTop: 14 }}
            />

            <TouchableOpacity
              style={styles.cancel}
              onPress={() => {
                setDeclining(null);
                setReason("");
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  countPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.primary,
  },

  centre: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardNew: {
    borderColor: "rgba(232,164,0,0.35)",
    backgroundColor: colors.white,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 22,
  },
  metaRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
  },

  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  statusText: { fontFamily: fonts.semibold, fontSize: 11 },

  brief: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
    marginTop: 12,
  },

  detailRow: { flexDirection: "row", gap: 24, marginTop: 14 },
  detail: {},
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.textDark,
    marginTop: 2,
  },

  footRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  client: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textMid,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  declineButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textMid,
  },
  acceptButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  singleButton: {
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  acceptText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
  },

  declineNote: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 12,
    fontStyle: "italic",
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

  /* Decline sheet */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,10,31,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
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
  },
  sheetBody: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
    marginTop: 6,
    marginBottom: 18,
  },

  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  quickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMid,
  },
  quickTextActive: { color: colors.white, fontFamily: fonts.semibold },

  reasonBox: {
    height: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.textDark,
  },

  cancel: { alignItems: "center", paddingVertical: 15 },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textLight,
  },
});
