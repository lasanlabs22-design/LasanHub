import Constants from "expo-constants";

/**
 * Everything that differs between environments, or that more than one
 * screen needs, lives here.
 *
 * API_URL can be overridden per EAS build profile with
 * EXPO_PUBLIC_API_URL — the default is production, which Lasan Mart
 * and the admin console also talk to.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://lasanmartapihono-production.up.railway.app";

/** Shared with Lasan Mart — the same Firebase project and Cloudinary account */
export const GOOGLE_WEB_CLIENT_ID =
  "619769435695-1af73d9j24u4mvjqtn8rqcupm7jlmhoo.apps.googleusercontent.com";

export const CLOUDINARY_CLOUD = "tpd2optn";
export const CLOUDINARY_PRESET = "lasan_reels";

/** Our team's WhatsApp / phone number, without +91 */
export const SUPPORT_PHONE = "8309074248";

export const PRIVACY_URL = "https://lasanmart.com/privacy";

/** Straight from app.json, so it can never drift from the real build */
export const APP_VERSION = Constants.expoConfig?.version ?? "—";
