import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, DimensionValue } from "react-native";

type Props = {
  /** How far the sweep travels — usually the card's width */
  width: number;
  /** How bright the streak is */
  opacity?: number;
  /** Milliseconds for one pass */
  duration?: number;
  /** Gap between passes, in milliseconds */
  delay?: number;
  /** How wide the streak itself is */
  streakWidth?: number;
  /** Overridden for taller cards */
  height?: DimensionValue;
};

/**
 * A light streak that sweeps left to right across its parent — the
 * same one Lasan Mart's home banners use. The parent needs
 * `overflow: "hidden"` and a position, or the streak escapes the card.
 */
export default function Shimmer({
  width,
  opacity = 0.22,
  duration = 1100,
  delay = 2600,
  streakWidth = 60,
  height = "200%",
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Snap back off-screen instantly, ready for the next pass
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [progress, duration, delay]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-streakWidth * 2, width + streakWidth],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.streak,
        {
          width: streakWidth,
          height,
          backgroundColor: `rgba(255,255,255,${opacity})`,
          transform: [{ translateX }, { rotate: "18deg" }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  streak: {
    position: "absolute",
    top: "-50%",
    left: 0,
  },
});
