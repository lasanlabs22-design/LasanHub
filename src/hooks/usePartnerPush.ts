import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { registerForPush } from "../lib/push";
import { registerPushToken } from "../api/client";

/**
 * Registers this phone for pushes once the partner has a profile,
 * opens the right screen when a notification is tapped, and keeps the
 * profile fresh when news arrives.
 *
 * Called once from the navigator, so it runs for the whole app.
 */
export function usePartnerPush(
  navigation: NavigationContainerRefWithCurrent<any>,
) {
  const { profile, refreshProfile } = useAuth();

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

  /* ---- Handle taps ----
     The hook covers both cases: a tap while the app is running, and
     the tap that launched it from closed. Reading the launch tap once
     at startup doesn't work — Android hands it over a moment after
     the JavaScript starts, so it came back empty. */
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    // Tabs and Updates only exist once the profile has loaded. Only a
    // plain tap opens a screen — not other notification actions.
    if (!lastResponse || !profile) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;

    const data = lastResponse.notification.request.content.data as any;

    // On a cold start the navigator mounts just after the profile
    // arrives, so wait for it rather than dropping the tap
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (!navigation.isReady()) {
        if (tries > 40) clearInterval(timer);
        return;
      }

      clearInterval(timer);
      handled.current = id;

      if (data?.type === "work") {
        navigation.navigate("Main", { screen: "Work" });
      } else {
        // Profile reviews and anything else land on the full list
        navigation.navigate("Notifications");
      }

      // So a later remount doesn't route there again
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }, 150);

    return () => clearInterval(timer);
  }, [lastResponse, profile, navigation]);

  /* ---- Keep the profile current ----
     An approval changes the Home card. Refresh when one arrives while
     the app is open, and whenever the app comes back to the front. */
  useEffect(() => {
    if (!profile) return;

    const received = Notifications.addNotificationReceivedListener(() => {
      refreshProfile();
    });

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshProfile();
    });

    return () => {
      received.remove();
      appState.remove();
    };
  }, [profile, refreshProfile]);
}
