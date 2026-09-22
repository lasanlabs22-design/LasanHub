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
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyWork,
  updateJob,
  AssignedJob,
  JobStatus,
} from "../api/client";
import { timeAgo } from "../lib/time";
import Button from "../components/Button";
import Chip from "../components/Chip";
import BottomSheet from "../components/BottomSheet";
import EmptyState from "../components/EmptyState";
import { TabHeader } from "../components/ScreenHeader";

/** `color` is readable as text on its own `bg` */
const STATUS: Record<JobStatus, { label: string; color: string; bg: string }> =
  {
    offered: {
      label: "New offer",
      color: colors.warningText,
      bg: tint(colors.warning, 0.12),
    },
    accepted: {
      label: "Accepted",
      color: colors.successText,
      bg: tint(colors.success, 0.12),
    },
    in_progress: {
      label: "In progress",
      color: colors.primary,
      bg: tint(colors.primary, 0.12),
    },
    completed: {
      label: "Completed",
      color: colors.successText,
      bg: tint(colors.success, 0.12),
    },
    declined: {
      label: "Declined",
      color: colors.textMid,
      bg: tint(colors.textLight, 0.12),
    },
    withdrawn: {
      label: "Withdrawn",
      color: colors.textMid,
      bg: tint(colors.textLight, 0.12),
    },
  };

const OPEN_STATUSES: JobStatus[] = ["offered", "accepted", "in_progress"];

const DECLINE_REASONS = [
  "Too busy right now",
  "Outside my area",
  "Budget too low",
  "Not my kind of work",
];

type PartnerAction = "accepted" | "declined" | "in_progress" | "completed";

/**
 * `details` is whatever the Lasan Mart request form sent, so a value
 * can be a number, an empty string or missing. Turn it into display
 * text, or null when there's nothing worth showing.
 */
function detailText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) value = value.join(", ");
  const text = String(value).trim();
  return text.length > 0 ? text : null;
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

  /* State updates a frame late; a ref stops a fast double tap
     sending the same change twice */
  const inFlight = useRef(false);

  /* The spinner is for the very first load only — coming back to the
     tab refreshes quietly behind what's already on screen */
  const hasLoaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);

    try {
      setJobs(await fetchMyWork());
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

  const change = async (
    job: AssignedJob,
    status: PartnerAction,
    extra?: { reason?: string },
  ) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusyId(job.id);

    try {
      await updateJob(job.id, { status, ...extra });
      setDeclining(null);
      setReason("");
      await load();
    } catch (err: any) {
      Alert.alert("Could not update", err?.message || "Please try again.");
    } finally {
      inFlight.current = false;
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

  // Tabs only mount once a profile exists
  if (!profile) return null;

  const openCount = jobs.filter((j) => OPEN_STATUSES.includes(j.status)).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <TabHeader
        title="Work"
        right={
          openCount > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{openCount} open</Text>
            </View>
          ) : undefined
        }
      />

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
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              busy={busyId === item.id}
              onAccept={() => change(item, "accepted")}
              onDecline={() => {
                setDeclining(item);
                setReason("");
              }}
              onStart={() => change(item, "in_progress")}
              onComplete={() => confirmComplete(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-clock-outline"
              title="No work yet"
              text={
                profile.status === "approved"
                  ? "You're live. When a client needs what you offer, it'll appear here."
                  : "Once your profile is approved, work we send your way appears here."
              }
            />
          }
        />
      )}

      {/* Declining — we ask why, so we can place it properly elsewhere */}
      <BottomSheet
        visible={!!declining}
        title="Why can't you take it?"
        body="No penalty for declining — it just helps us find someone else quickly."
        onClose={() => {
          setDeclining(null);
          setReason("");
        }}
        closeDisabled={!!busyId}
      >
        <View style={styles.quickWrap}>
          {DECLINE_REASONS.map((r) => (
            <Chip
              key={r}
              label={r}
              active={reason === r}
              onPress={() => setReason(r)}
            />
          ))}
        </View>

        <TextInput
          style={styles.reasonBox}
          value={reason}
          onChangeText={setReason}
          placeholder="Or tell us in your own words"
          placeholderTextColor={colors.textLight}
          accessibilityLabel="Reason for declining"
          multiline
          maxLength={300}
          textAlignVertical="top"
        />

        <Button
          label="Send"
          onPress={() => {
            if (declining) {
              change(declining, "declined", { reason: reason.trim() });
            }
          }}
          disabled={reason.trim().length < 3}
          busy={!!declining && busyId === declining.id}
          style={{ marginTop: 14 }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

/* ---------- One job ---------- */

function JobCard({
  job,
  busy,
  onAccept,
  onDecline,
  onStart,
  onComplete,
}: {
  job: AssignedJob;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const s = STATUS[job.status] || STATUS.offered;

  const service = detailText(job.details?.service);
  const budget = detailText(job.details?.budget);
  const timeline = detailText(job.details?.timeline);
  const city = detailText(job.city);
  const brief = detailText(job.brief) || detailText(job.description);
  const declineReason = detailText(job.decline_reason);

  const meta = [service, city].filter(Boolean).join(" · ");

  return (
    <View style={[styles.card, job.status === "offered" && styles.cardNew]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {detailText(job.title) || service || "Marketing work"}
          </Text>

          {!!meta && <Text style={styles.meta}>{meta}</Text>}
        </View>

        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>
            {s.label}
          </Text>
        </View>
      </View>

      {/* The brief our team wrote, or the request itself */}
      {!!brief && (
        <Text style={styles.brief} numberOfLines={4}>
          {brief}
        </Text>
      )}

      {/* Budget and timing, if the client gave them */}
      {(!!budget || !!timeline) && (
        <View style={styles.detailRow}>
          {!!budget && <Detail label="Budget" value={budget} />}
          {!!timeline && <Detail label="Timeline" value={timeline} />}
        </View>
      )}

      <View style={styles.footRow}>
        <Text style={styles.client}>
          For {detailText(job.customer_name) || "a client"}
        </Text>
        <Text style={styles.time}>{timeAgo(job.assigned_at)}</Text>
      </View>

      {/* Actions, by state */}
      {job.status === "offered" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineButton}
            activeOpacity={0.85}
            onPress={onDecline}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.declineText}>Can't take it</Text>
          </TouchableOpacity>

          <ActionButton label="Accept" busy={busy} onPress={onAccept} flex />
        </View>
      )}

      {job.status === "accepted" && (
        <ActionButton label="Start work" busy={busy} onPress={onStart} />
      )}

      {job.status === "in_progress" && (
        <ActionButton
          label="Mark complete"
          busy={busy}
          onPress={onComplete}
          color={colors.successText}
        />
      )}

      {job.status === "declined" && !!declineReason && (
        <Text style={styles.declineNote}>You said: {declineReason}</Text>
      )}
    </View>
  );
}

function ActionButton({
  label,
  busy,
  onPress,
  color = colors.primary,
  flex,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
  color?: string;
  flex?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: color },
        flex ? styles.actionFlex : styles.actionSingle,
      ]}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={styles.actionText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  countPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: size.sm,
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
    borderColor: tint(colors.warning, 0.35),
    backgroundColor: colors.white,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: size.lg,
    color: colors.textDark,
    lineHeight: 22,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    marginTop: 4,
  },

  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  statusText: { fontFamily: fonts.semibold, fontSize: size.xxs },

  brief: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 20,
    color: colors.textMid,
    marginTop: 12,
  },

  detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginTop: 14 },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: size.xxs,
    color: colors.textLight,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.textDark,
    marginTop: 2,
  },

  footRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  client: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: size.sm,
    color: colors.textMid,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  declineButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  declineText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.textMid,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  actionFlex: { flex: 1 },
  actionSingle: { marginTop: 14 },
  actionText: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.white,
  },

  declineNote: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    marginTop: 12,
    fontStyle: "italic",
  },

  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonBox: {
    minHeight: 90,
    maxHeight: 160,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: size.base,
    color: colors.textDark,
  },
});
