import { Linking } from "react-native";
import { SUPPORT_PHONE, PRIVACY_URL } from "../config";

/** WhatsApp our team, falling back to a phone call if WhatsApp isn't there */
export function messageSupport() {
  Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}`).catch(() =>
    Linking.openURL(`tel:+91${SUPPORT_PHONE}`).catch(() => {}),
  );
}

export function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_URL).catch(() => {});
}
