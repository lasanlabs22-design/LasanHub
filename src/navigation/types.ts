import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type TabParamList = {
  Home: undefined;
  Support: undefined;
  Work: undefined;
  Account: undefined;
};

/**
 * Only the signed-in screens are listed with params. The sign-up steps
 * before them (Onboarding, Auth, Welcome, CreateProfile, SignIn) are
 * driven by state in AppNavigator, not by navigate() calls.
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Welcome: undefined;
  CreateProfile: undefined;
  SignIn: undefined;
  Offline: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Profile: undefined;
  Notifications: undefined;
  Faq: undefined;
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
