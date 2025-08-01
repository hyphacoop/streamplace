import {
  Chat,
  ChatBox,
  LivestreamProvider,
  PlayerProvider,
  ThemeProvider,
} from "@streamplace/components";
import emojiData from "assets/emoji-data.json";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { useAppSelector } from "store/hooks";
import { View } from "tamagui";

export default function PopoutChat({ route }) {
  const user = route.params?.user;
  if (typeof user !== "string") {
    return <View />;
  }
  const profile = useAppSelector(selectUserProfile);
  return (
    <ThemeProvider>
      <LivestreamProvider src={user}>
        <PlayerProvider>
          <View position="relative" f={1} margin="$2">
            <View
              f={1}
              position="absolute"
              width="100%"
              minHeight="100%"
              bottom={0}
            >
              <Chat />
              {profile && <ChatBox emojiData={emojiData} isPopout={true} />}
            </View>
          </View>
        </PlayerProvider>
      </LivestreamProvider>
    </ThemeProvider>
  );
}
