/**
 * District's calm surfaces with PhonePe's confident purple.
 * Deliberately narrow — one accent, one neutral scale, nothing else.
 */
export const colors = {
  primary: "#5F259F",
  primaryDark: "#4A1C7D",
  primaryLight: "#7B3FC4",
  primarySoft: "#F2EDFA",

  /* Deep ink for headers and full-bleed panels */
  ink: "#0F0A1F",
  inkSoft: "#1C1435",

  background: "#FFFFFF",
  surface: "#F7F6FA",
  surfaceDeep: "#EFEDF4",

  textDark: "#16121F",
  textMid: "#5C5670",
  textLight: "#918CA3",
  border: "#E8E5EF",

  white: "#FFFFFF",
  success: "#0EA97A",
  warning: "#E8A400",
  danger: "#D93025",
};

/** Status colours, used in a few places */
export const statusMeta = {
  none: { label: "Not submitted", color: colors.textLight },
  pending: { label: "Under review", color: colors.warning },
  approved: { label: "Approved", color: colors.success },
  rejected: { label: "Needs changes", color: colors.danger },
  paused: { label: "Paused", color: colors.textMid },
};
