/**
 * One family, four weights. Plus Jakarta Sans is what District uses —
 * geometric, calm, reads well at small sizes.
 */
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

/**
 * The only font sizes the app uses. Nothing below 11 — that's the
 * smallest that stays legible on a budget phone in sunlight.
 */
export const size = {
  /** Tab labels, badges, uppercase section labels */
  xxs: 11,
  /** Timestamps, hints */
  xs: 12,
  /** Secondary lines, chips, form labels */
  sm: 13,
  /** Body copy */
  md: 14,
  /** Inputs, list titles */
  base: 15,
  /** Buttons, card titles */
  lg: 16,
  /** Screen header titles */
  xl: 17,
  /** Sheet and card headlines */
  h3: 20,
  /** Big numbers, avatar letters */
  h2: 22,
  /** Tab screen titles */
  h1: 24,
  /** Dark-screen headlines */
  display: 30,
  hero: 34,
};

/**
 * Cap for text inside fixed-size shapes (badges, code boxes, pills).
 * Everything else scales freely with the phone's font setting.
 */
export const TIGHT_SCALE = 1.3;
