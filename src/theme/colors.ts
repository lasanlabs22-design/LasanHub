/**
 * District's calm surfaces with PhonePe's confident purple.
 * Deliberately narrow — one accent, one neutral scale, nothing else.
 *
 * Every text colour here passes WCAG AA (4.5:1) on white and on
 * `surface`. The bright status colours are for dots and icons; use
 * the matching `*Text` shade when the colour carries words.
 */
export const colors = {
  primary: "#5F259F",
  primaryDark: "#4A1C7D",
  primaryLight: "#7B3FC4",
  primarySoft: "#F2EDFA",
  /** Purple that stays readable on the dark ink screens */
  primaryOnDark: "#A77BE0",

  /* Deep ink for headers and full-bleed panels */
  ink: "#0F0A1F",
  inkSoft: "#1C1435",

  background: "#FFFFFF",
  surface: "#F7F6FA",
  surfaceDeep: "#EFEDF4",

  textDark: "#16121F",
  textMid: "#5C5670",
  textLight: "#6E6983",
  border: "#E8E5EF",

  white: "#FFFFFF",

  success: "#0EA97A",
  successText: "#0A7A58",
  successSoft: "#E6F8EE",
  warning: "#E8A400",
  warningText: "#8F6000",
  danger: "#D93025",
  /** Errors shown on the dark ink screens */
  dangerOnDark: "#FF8080",

  /** The notification badge — needs to pop against the purple card */
  badge: "#FFC529",

  /** White text on ink, from loudest to quietest. Quietest still reads. */
  onDark: "#FFFFFF",
  onDarkHigh: "rgba(255,255,255,0.82)",
  onDarkMid: "rgba(255,255,255,0.7)",
  onDarkLow: "rgba(255,255,255,0.6)",
  onDarkLine: "rgba(255,255,255,0.1)",

  /** Scrim behind bottom sheets */
  scrim: "rgba(15,10,31,0.5)",
};

/** A colour at the given opacity, for tints of an accent. `hex` must be #RRGGBB. */
export function tint(hex: string, opacity: number): string {
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `${hex}${alpha}`;
}

/** Profile review status — dot colour and label */
export const statusMeta = {
  none: { label: "Not submitted", color: colors.textLight },
  pending: { label: "Under review", color: colors.warning },
  approved: { label: "Approved", color: colors.success },
  rejected: { label: "Needs changes", color: colors.danger },
  paused: { label: "Paused", color: colors.textMid },
};
