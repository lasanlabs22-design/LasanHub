import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { registerForPush } from "../lib/push";
import { registerPushToken } from "../api/client";

/**
 * Registers this phone for pushes once the partner has a profile, and
 * opens the right screen when a notification is tapped.
 *
 * Called once from the navigator, so it runs for the whole app.
 */
export function usePartnerPush(
  navigation: NavigationContainerRefWithCurrent<any>,
) {
  const { profile } = useAuth();

  // Avoid asking for permission and registering twice in one session
  const registered = useRef(false);

  /* ---- Register the device ---- */
  useEffect(() => {
    // Nothing to attach a token to until a profile exists
    if (!profile) {
      registered.current = false;
      return;
    }

    if (registered.current) return;

    (async () => {
      const token = await registerForPush();
      if (!token) return;
      registered.current = await registerPushToken(token);
    })();
  }, [profile]);

  /* ---- Handle taps ---- */
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;

      // Main and its tabs only exist once a profile has loaded
      if (!navigation.isReady()) return;

      if (data?.type === "work") {
        navigation.navigate("Main", { screen: "Work" });
      } else {
        // Profile reviews and anything else land on the full list
        navigation.navigate("Notifications");
      }
    };

    // A tap that launched the app from closed arrives before any
    // listener exists — read it once, after the screens are up, then
    // forget it so a later remount doesn't route there again
    const launch = Notifications.getLastNotificationResponse();
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (launch && profile) {
      timer = setTimeout(() => open(launch), 400);
      Notifications.clearLastNotificationResponse();
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
    // Re-run when the profile arrives: on a cold start the tabs that a
    // tap opens only exist once it has loaded
  }, [navigation, profile]);
}
