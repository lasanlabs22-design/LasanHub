import React, { useState, useCallback, useRef } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import {
  fetchNotifications,
  markNotificationsRead,
  PartnerNotification,
} from "../api/client";
import { timeAgo } from "../lib/time";
import ScreenHeader from "../components/ScreenHeader";
import EmptyState from "../components/EmptyState";
import type { RootNavigation } from "../navigation/types";

const META: Record<PartnerNotification["type"], { icon: string; colour: string }> = {
  work: { icon: "briefcase-outline", colour: colors.primary },
  profile: { icon: "shield-check-outline", colour: colors.successText },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();

  const [items, setItems] = useState<PartnerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else if (!hasLoaded.current) setLoading(true);

    try {
      const data = await fetchNotifications();
      setItems(data.notifications);
      setUnread(data.unread);
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

  const markAll = () => {
    // Update the screen first, then tell the server
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    setUnread(0);
    markNotificationsRead();
  };

  const open = (item: PartnerNotification) => {
    if (!item.read_at) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: now } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
      markNotificationsRead(item.id);
    }

    // Anything about a job takes them to the Work tab
    if (item.type === "work") {
      navigation.navigate("Main", { screen: "Work" });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Updates"
        subtitle={unread > 0 ? `${unread} unread` : undefined}
        onBack={() => navigation.goBack()}
        right={
          unread > 0 ? (
            <TouchableOpacity
              onPress={markAll}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Text style={styles.markAll}>Mark all</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

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
              colors={[colors.primary]}
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
                accessibilityRole="button"
                accessibilityLabel={`${isUnread ? "Unread. " : ""}${item.title}. ${item.body}`}
              >
                <View
                  style={[styles.icon, { backgroundColor: tint(meta.colour, 0.08) }]}
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
            <EmptyState
              icon="bell-outline"
              title="Nothing yet"
              text="We'll let you know here when there's work for you, or news about your profile."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  markAll: {
    fontFamily: fonts.semibold,
    fontSize: size.sm,
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
    borderColor: tint(colors.primary, 0.25),
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
    fontSize: size.base,
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
    fontSize: size.sm,
    lineHeight: 19,
    color: colors.textMid,
    marginTop: 3,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: size.xs,
    color: colors.textLight,
    marginTop: 8,
  },
});
