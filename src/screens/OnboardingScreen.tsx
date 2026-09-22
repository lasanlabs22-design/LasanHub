import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tint } from "../theme/colors";
import { fonts, size } from "../theme/typography";
import { roleMeta } from "../data/roles";

const SLIDE_MS = 4500;

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: string;
  accent: string;
  points: string[];
};

const SLIDES: Slide[] = [
  {
    key: "intro",
    eyebrow: "LASAN HUB",
    title: "Where local\ntalent gets found",
    body: "Businesses across Andhra Pradesh use Lasan Mart to find marketing help. This is where the people who provide it sign up.",
    icon: "star-four-points",
    accent: colors.primaryLight,
    points: [
      "One profile, reviewed once",
      "Work comes to you",
      "Free to join, always",
    ],
  },
  {
    key: "influencer",
    eyebrow: "FOR CREATORS",
    title: "Brands find you,\nnot the reverse",
    body: "Set your rate once. Businesses browse creators by budget and category, and our team brings you the brief.",
    icon: "account-star-outline",
    accent: roleMeta("influencer").accent,
    points: [
      "Instagram, YouTube, city pages",
      "You set your own rate",
      "We handle the negotiating",
    ],
  },
  {
    key: "vendor",
    eyebrow: "FOR VENDORS",
    title: "Steady work,\nwithout the chasing",
    body: "Hoardings, printing, events, field teams — when a client needs it, we come to the vendors on this list first.",
    icon: "storefront-outline",
    accent: roleMeta("vendor").accent,
    points: [
      "Outdoor, print, events, branding",
      "Real briefs, already paid for",
      "Verified once, listed for good",
    ],
  },
  {
    key: "freelancer",
    eyebrow: "FOR FREELANCERS",
    title: "Get briefed,\nnot ghosted",
    body: "Design, video, writing, development. No bidding wars, no undercutting, no chasing invoices.",
    icon: "laptop",
    accent: roleMeta("freelancer").accent,
    points: [
      "Show your portfolio once",
      "Scoped briefs, priced upfront",
      "Paid through us",
    ],
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  /* Live width, so paging stays right on split-screen and foldables */
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Drives the thin progress bar on the active dot */
  const progress = useRef(new Animated.Value(0)).current;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      indexRef.current = clamped;
      setIndex(clamped);
      listRef.current?.scrollToOffset({
        offset: clamped * width,
        animated: true,
      });
    },
    [width],
  );

  /* Auto-advance, unless they're touching it */
  useEffect(() => {
    if (paused) return;

    progress.setValue(0);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (!finished) return;

      // Stop at the last slide rather than looping — they've seen it all
      if (indexRef.current < SLIDES.length - 1) {
        goTo(indexRef.current + 1);
      }
    });

    return () => anim.stop();
  }, [index, paused, progress, goTo]);

  const isLast = index === SLIDES.length - 1;
  const active = SLIDES[index];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.ink, colors.inkSoft, colors.ink]}
        style={StyleSheet.absoluteFill}
      />

      {/* The glow takes the active slide's colour */}
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: active.accent }]}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          {!isLast && (
            <TouchableOpacity
              onPress={onDone}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip the introduction"
            >
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          onScrollBeginDrag={() => setPaused(true)}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            indexRef.current = i;
            setIndex(i);
            setPaused(false);
          }}
          renderItem={({ item }) => <SlideView slide={item} width={width} />}
        />

        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => {
            const isActive = i === index;

            return (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.7}
                onPress={() => goTo(i)}
                hitSlop={{ top: 14, bottom: 14, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Slide ${i + 1} of ${SLIDES.length}`}
                accessibilityState={{ selected: isActive }}
                style={[styles.dot, isActive && styles.dotActive]}
              >
                {isActive && (
                  <Animated.View
                    style={[
                      styles.dotFill,
                      {
                        backgroundColor: active.accent,
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.next, { backgroundColor: active.accent }]}
            activeOpacity={0.9}
            onPress={() => (isLast ? onDone() : goTo(index + 1))}
            accessibilityRole="button"
          >
            <Text style={styles.nextText}>
              {isLast ? "Get started" : "Next"}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ---------- One slide ---------- */

function SlideView({ slide, width }: { slide: Slide; width: number }) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const slideUp = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    /* Scrolls by itself if a short phone or a large font can't fit it */
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.slide}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{ opacity: rise, transform: [{ translateY: slideUp }] }}
      >
        <View style={[styles.icon, { backgroundColor: tint(slide.accent, 0.15) }]}>
          <MaterialCommunityIcons
            name={slide.icon as any}
            size={32}
            color={slide.accent}
          />
        </View>

        <Text style={[styles.eyebrow, { color: slide.accent }]}>
          {slide.eyebrow}
        </Text>

        <Text style={styles.title} accessibilityRole="header">
          {slide.title}
        </Text>
        <Text style={styles.body}>{slide.body}</Text>

        <View style={styles.points}>
          {slide.points.map((p) => (
            <View key={p} style={styles.point}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={slide.accent}
              />
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  glow: {
    position: "absolute",
    top: "-12%",
    alignSelf: "center",
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.2,
  },

  topBar: {
    minHeight: 44,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  skip: {
    fontFamily: fonts.semibold,
    fontSize: size.md,
    color: colors.onDarkLow,
  },

  slide: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: "center",
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 26,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: size.xxs,
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: size.display,
    lineHeight: 38,
    color: colors.onDark,
    letterSpacing: -0.9,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: size.base,
    lineHeight: 23,
    color: colors.onDarkMid,
    marginTop: 14,
  },

  points: { marginTop: 30, gap: 13 },
  point: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: size.base,
    color: colors.onDarkHigh,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 22,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  dotActive: { width: 34 },
  dotFill: { height: "100%", borderRadius: 4 },

  footer: { paddingHorizontal: 26, paddingBottom: 22 },
  next: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextText: {
    fontFamily: fonts.semibold,
    fontSize: size.lg,
    color: colors.white,
  },
});
