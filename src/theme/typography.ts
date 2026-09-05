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

export const type = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -0.7,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
  },
};
