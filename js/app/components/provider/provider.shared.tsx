import {
  DarkTheme,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import {
  ThemeProvider,
  StreamplaceProvider as ZustandStreamplaceProvider,
} from "@streamplace/components";
import { useFonts } from "expo-font";
import BlueskyProvider from "features/bluesky/blueskyProvider";
import { selectOAuthSession } from "features/bluesky/blueskySlice";
import StreamplaceProvider from "features/streamplace/streamplaceProvider";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { useAppSelector } from "store/hooks";
import { store } from "store/store";
import { PortalProvider, TamaguiProvider } from "tamagui";
import config from "tamagui.config";
import { CurrentToast } from "./CurrentToast";

export default Sentry.wrap(ProviderInner);

import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
Sentry.setExtras({
  manifest: Updates.manifest,
  linkingUri: Constants.linkingUri,
});
Sentry.setTag("expoChannel", Updates.channel);
Sentry.setTag("appVersion", Application.nativeApplicationVersion);
Sentry.setTag("deviceId", Constants.sessionId);
Sentry.setTag("executionEnvironment", Constants.executionEnvironment);
Sentry.setTag("expoGoVersion", Constants.expoVersion);
Sentry.setTag("expoRuntimeVersion", Constants.expoRuntimeVersion);

function ProviderInner({
  children,
  linking,
}: {
  children: React.ReactNode;
  linking: LinkingOptions<ReactNavigation.RootParamList>;
}) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    spotlight: __DEV__,
  });

  return (
    <ThemeProvider forcedTheme="dark">
      <NavigationContainer theme={DarkTheme} linking={linking}>
        <ReduxProvider store={store}>
          <StreamplaceProvider>
            <BlueskyProvider>
              <NewStreamplaceProvider>
                <FontProvider>{children}</FontProvider>
              </NewStreamplaceProvider>
            </BlueskyProvider>
          </StreamplaceProvider>
        </ReduxProvider>
      </NavigationContainer>
    </ThemeProvider>
  );
}

export const NewStreamplaceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { url } = useStreamplaceNode();
  const oauthSession = useAppSelector(selectOAuthSession);
  return (
    <ZustandStreamplaceProvider url={url} oauthSession={oauthSession}>
      {children}
    </ZustandStreamplaceProvider>
  );
};

export const FontProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontLoaded, fontError] = useFonts({
    // Atkinson Hyperlegible Next (Sans Serif) fonts
    "AtkinsonHyperlegibleNext-Regular": require("../../assets/fonts/AtkinsonHyperlegibleNext-Regular.ttf"),
    "AtkinsonHyperlegibleNext-Light": require("../../assets/fonts/AtkinsonHyperlegibleNext-Light.ttf"),
    "AtkinsonHyperlegibleNext-ExtraLight": require("../../assets/fonts/AtkinsonHyperlegibleNext-ExtraLight.ttf"),
    "AtkinsonHyperlegibleNext-Medium": require("../../assets/fonts/AtkinsonHyperlegibleNext-Medium.ttf"),
    "AtkinsonHyperlegibleNext-SemiBold": require("../../assets/fonts/AtkinsonHyperlegibleNext-SemiBold.ttf"),
    "AtkinsonHyperlegibleNext-Bold": require("../../assets/fonts/AtkinsonHyperlegibleNext-Bold.ttf"),
    "AtkinsonHyperlegibleNext-ExtraBold": require("../../assets/fonts/AtkinsonHyperlegibleNext-ExtraBold.ttf"),

    // Atkinson Hyperlegible Mono fonts
    "AtkinsonHyperlegibleMono-Regular": require("../../assets/fonts/AtkinsonHyperlegibleMono-Regular.ttf"),
    "AtkinsonHyperlegibleMono-Medium": require("../../assets/fonts/AtkinsonHyperlegibleMono-Medium.ttf"),
    "AtkinsonHyperlegibleMono-SemiBold": require("../../assets/fonts/AtkinsonHyperlegibleMono-SemiBold.ttf"),
    "AtkinsonHyperlegibleMono-Bold": require("../../assets/fonts/AtkinsonHyperlegibleMono-Bold.ttf"),
  });

  if (!fontLoaded && !fontError) {
    return null;
  }

  return <>{children}</>;
};
