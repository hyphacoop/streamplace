import {
  DarkTheme,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { StreamplaceProvider as ZustandStreamplaceProvider } from "@streamplace/components";
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
    "FiraCode-Light": require("../../assets/fonts/FiraCode-Light.ttf"),
    "FiraCode-Medium": require("../../assets/fonts/FiraCode-Medium.ttf"),
    "FiraCode-Bold": require("../../assets/fonts/FiraCode-Bold.ttf"),
    "FiraSans-Medium": require("../../assets/fonts/FiraSans-Medium.ttf"),
    "AtkinsonHyperlegible-Regular": require("../../assets/fonts/AtkinsonHyperlegibleNext-Regular.ttf"),
    "AtkinsonHyperlegible-Bold": require("../../assets/fonts/AtkinsonHyperlegibleNext-Bold.ttf"),
  });

  if (!fontLoaded && !fontError) {
    return null;
  }

  return <>{children}</>;
};
