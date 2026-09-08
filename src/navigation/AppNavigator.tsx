import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";
import { Role } from "../data/roles";
import AuthScreen from "../screens/AuthScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RequestsScreen from "../screens/RequestsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Filled when active, outline when not */
const ICONS: Record<string, { on: string; off: string }> = {
  Home: { on: "view-dashboard", off: "view-dashboard-outline" },
  Support: { on: "message-text", off: "message-text-outline" },
  Account: { on: "account-circle", off: "account-circle-outline" },
};

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 10.5,
        },
        tabBarIcon: ({ color, focused }) => {
          const icon = ICONS[route.name] || ICONS.Home;
          return (
            <MaterialCommunityIcons
              name={(focused ? icon.on : icon.off) as any}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Support" component={RequestsScreen} />
      <Tab.Screen name="Account" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isReady, isSignedIn, profile } = useAuth();

  /**
   * What they said they are on the intro. Not persisted — anyone
   * without a profile should see the pitch again next launch, and
   * the saved profile carries the role once one exists.
   */
  const [chosenRole, setChosenRole] = useState<Role | null>(null);

  /** Whether they've clicked through the role-specific Welcome screen
   *  this session. Not persisted either, for the same reason. */
  const [seenWelcome, setSeenWelcome] = useState(false);

  /* Signing out sends them back to the pitch, not the half-filled form */
  useEffect(() => {
    if (!isSignedIn && !profile) {
      setChosenRole(null);
      setSeenWelcome(false);
    }
  }, [isSignedIn, profile]);

  // Hold the splash until we know which screen belongs on screen
  if (!isReady) {
    return <View style={styles.blank} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!profile && !chosenRole ? (
          /* The pitch, and picking what they are. No OTP yet. */
          <Stack.Screen name="Auth">
            {() => <AuthScreen onContinue={(r) => setChosenRole(r)} />}
          </Stack.Screen>
        ) : !profile && !seenWelcome ? (
          /* Role-specific welcome, shown once before the profile form. */
          <Stack.Screen name="Welcome">
            {() => (
              <WelcomeScreen
                role={chosenRole!}
                onContinue={() => setSeenWelcome(true)}
                onBack={() => setChosenRole(null)}
              />
            )}
          </Stack.Screen>
        ) : !profile ? (
          /* The form, shaped by their role. The number gets verified
             when they submit. */
          <Stack.Screen name="CreateProfile">
            {(props) => (
              <ProfileScreen
                {...props}
                role={chosenRole || "influencer"}
                onBack={() => setSeenWelcome(false)}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ presentation: "modal" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: colors.ink },
});
