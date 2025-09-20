import {
  DarkTheme,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
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

export default function Provider({
  children,
  linking,
}: {
  children: React.ReactNode;
  linking: LinkingOptions<ReactNavigation.RootParamList>;
}) {
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
