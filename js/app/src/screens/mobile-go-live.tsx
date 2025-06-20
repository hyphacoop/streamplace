import { theme } from "@streamplace/components";
import { Player } from "components/mobile/player";
import { FullscreenProvider } from "contexts/FullscreenContext";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { useAppSelector } from "store/hooks";
import { Text } from "tamagui";

export default function MobileGoLive() {
  const userProfile = useAppSelector(selectUserProfile);

  if (!userProfile) {
    // If user profile is not available, redirect to login or show an error
    return <Text>You need to log in to go live!</Text>;
  }
  // get player
  return (
    <theme.ThemeProvider>
      <FullscreenProvider>
        <Player ingest src={userProfile.did} name={userProfile.handle} />
      </FullscreenProvider>
    </theme.ThemeProvider>
  );
}
