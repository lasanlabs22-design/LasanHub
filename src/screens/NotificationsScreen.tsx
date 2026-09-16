import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import {
  fetchNotifications,
  markNotificationsRead,
  PartnerNotification,
} from "../api/client";

const META: Record<string, { icon: string; colour: string }> = {
  work: { icon: "briefcase-outline", colour: "#5F259F" },
  profile: { icon: "shield-check-outline", colour: "#0EA97A" },
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<PartnerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchNotifications();
      setItems(data.notifications);
      setUnread(data.unread);
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

  const markAll = async () => {
    // Update the screen first, then tell the server
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    );
    setUnread(0);
    await markNotificationsRead();
  };

  const open = async (item: PartnerNotification) => {
    if (!item.read_at) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationsRead(item.id);
    }

    // Anything about a job takes them to the Work tab
    if (item.type === "work") {
      navigation.navigate("Main", { screen: "Work" });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
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

        <View style={styles.headerMiddle}>
          <Text style={styles.headerTitle}>Updates</Text>
          {unread > 0 && <Text style={styles.headerSub}>{unread} unread</Text>}
        </View>

        {unread > 0 ? (
          <TouchableOpacity onPress={markAll} hitSlop={10}>
            <Text style={styles.markAll}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
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
            const meta = META[item.type] || META.work;
            const isUnread = !item.read_at;

            return (
              <TouchableOpacity
                style={[styles.card, isUnread && styles.cardUnread]}
                activeOpacity={0.85}
                onPress={() => open(item)}
              >
                <View
                  style={[styles.icon, { backgroundColor: `${meta.colour}14` }]}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={19}
                    color={meta.colour}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {isUnread && <View style={styles.dot} />}
                  </View>

                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={28}
                  color={colors.textLight}
                />
              </View>
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyText}>
                We'll let you know here when there's work for you, or news about
                your profile.
              </Text>
            </View>
          }
        />
      )}
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
  headerMiddle: { alignItems: "center" },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.primary,
    marginTop: 1,
  },
  markAll: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.primary,
  },

  centre: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 20, gap: 10 },

  card: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardUnread: {
    backgroundColor: colors.white,
    borderColor: "rgba(95,37,159,0.25)",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textDark,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMid,
    marginTop: 3,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textLight,
    marginTop: 8,
  },

  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 40 },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 7,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMid,
    textAlign: "center",
  },
});
