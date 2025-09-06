import {
  Chat,
  ChatBox,
  LivestreamProvider,
  PlayerProvider,
  usePlayerStore,
  zero,
} from "@streamplace/components";
import emojiData from "assets/emoji-data.json";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { useEffect } from "react";
import { View } from "react-native";
import { useAppSelector } from "store/hooks";

export default function PopoutChat({ route }) {
  const user = route.params?.user;
  if (typeof user !== "string") {
    return <View />;
  }

  return (
    <LivestreamProvider src={user}>
      <PlayerProvider>
        <PopoutChatInner user={user} />
      </PlayerProvider>
    </LivestreamProvider>
  );
}

export function PopoutChatInner({ user }: { user: string }) {
  const setSrc = usePlayerStore((x) => x.setSrc);
  const profile = useAppSelector(selectUserProfile);
  useEffect(() => {
    setSrc(user);
  }, [user]);
  return (
    <View style={[{ position: "relative" }, zero.flex.values[1], zero.m[2]]}>
      <View
        style={[
          zero.flex.values[1],
          { position: "absolute", width: "100%", minHeight: "100%", bottom: 0 },
        ]}
      >
        <Chat canModerate={profile?.handle === user} />
        {profile && <ChatBox emojiData={emojiData} isPopout={true} />}
      </View>
    </View>
  );
}
