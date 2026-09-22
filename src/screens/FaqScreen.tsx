import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { faqsFor, Faq } from "../data/faqs";
import { messageSupport } from "../lib/support";
import ScreenHeader from "../components/ScreenHeader";
import type { RootNavigation } from "../navigation/types";

// Android needs this switched on for the expand animation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { profile } = useAuth();

  const questions = faqsFor(profile?.role || "influencer");

  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title="Common questions"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {questions.map((q) => (
            <Row
              key={q.id}
              faq={q}
              open={openId === q.id}
              onPress={() => toggle(q.id)}
            />
          ))}
        </View>

        {/* Anything not covered goes to a person */}
        <TouchableOpacity
          style={styles.helpCard}
          activeOpacity={0.9}
          onPress={messageSupport}
          accessibilityRole="button"
        >
          <View style={styles.helpIcon}>
            <MaterialCommunityIcons
              name="whatsapp"
              size={20}
              color={colors.successText}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Still stuck?</Text>
            <Text style={styles.helpText}>
              Message our team — usually replies within a few hours
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  faq,
  open,
  onPress,
}: {
  faq: Faq;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, open && styles.cardOpen]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.question, open && styles.questionOpen]}>
          {faq.question}
        </Text>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={19}
          color={open ? colors.primary : colors.textLight}
        />
      </View>

      {open && <Text style={styles.answer}>{faq.answer}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  content: { padding: 20 },
  list: { gap: 9 },

  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 15,
  },
  cardOpen: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  question: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: size.base,
    lineHeight: 20,
    color: colors.textDark,
  },
  questionOpen: { color: colors.primary },
  answer: {
    fontFamily: fonts.regular,
    fontSize: size.md,
    lineHeight: 21,
    color: colors.textDark,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tint(colors.primary, 0.18),
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    marginTop: 26,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.successSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  helpTitle: {
    fontFamily: fonts.semibold,
    fontSize: size.base,
    color: colors.textDark,
  },
  helpText: {
    fontFamily: fonts.regular,
    fontSize: size.sm,
    color: colors.textLight,
    marginTop: 2,
  },
});
