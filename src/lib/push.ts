import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { devLog } from "./log";

/**
 * What happens when a notification arrives while the app is open.
 * Without this, foreground notifications are silently swallowed.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Asks permission and returns this device's push token.
 * Null if they decline, or on an emulator — push needs a real phone.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    // Android needs a channel before anything shows. The backend sends
    // on "default", the same as Lasan Mart.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Work and profile updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#5F259F",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    // Only ask if we haven't already — repeated prompts annoy people
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }

    if (status !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return token.data;
  } catch (err) {
    devLog("Could not register for push:", err);
    return null;
  }
}
