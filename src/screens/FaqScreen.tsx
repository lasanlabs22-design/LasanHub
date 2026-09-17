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
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { faqsFor, Faq } from "../data/faqs";
import { Role } from "../data/roles";

const SUPPORT_PHONE = "8309074248";

// Android needs this switched on for the expand animation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const role: Role = profile?.role || "influencer";
  const questions = faqsFor(role);

  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  };

  const whatsapp = () =>
    Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}`).catch(() =>
      Linking.openURL(`tel:+91${SUPPORT_PHONE}`),
    );

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
        <Text style={styles.headerTitle}>Common questions</Text>
        <View style={{ width: 38 }} />
      </View>

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
          onPress={whatsapp}
        >
          <View style={styles.helpIcon}>
            <MaterialCommunityIcons name="whatsapp" size={20} color="#0EA97A" />
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
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.textDark,
  },
  questionOpen: { color: colors.primary },
  answer: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textDark,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(95,37,159,0.18)",
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
    backgroundColor: "#E6F8EE",
    justifyContent: "center",
    alignItems: "center",
  },
  helpTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textDark,
  },
  helpText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textLight,
    marginTop: 2,
  },
});
