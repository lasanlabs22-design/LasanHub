import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { configureGoogle } from "./src/lib/auth";

configureGoogle();

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      {/* Dark icons for the white screens. The dark sign-up screens
          switch to light icons themselves while they're showing. */}
      <StatusBar style="dark" />
      <ErrorBoundary>
        <AuthProvider>
          {/* A font that fails to load falls back to the system font
              rather than leaving the splash up forever */}
          <Gate fontsReady={fontsLoaded || !!fontError} />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

/** Waits for both the fonts and the auth check before showing anything */
function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { isReady } = useAuth();

  /* An effect rather than onLayout: layout happens once, often before
     the auth check has finished, and would leave the splash up */
  useEffect(() => {
    if (fontsReady && isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, isReady]);

  if (!fontsReady) return null;

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}
