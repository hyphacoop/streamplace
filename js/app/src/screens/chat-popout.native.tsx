import { useNavigation } from "@react-navigation/native";
import {
  Chat,
  ChatBox,
  LivestreamProvider,
  PlayerProvider,
  Text,
  useKeyboard,
  usePlayerStore,
  zero,
} from "@streamplace/components";
import emojiData from "assets/emoji-data.json";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { ArrowLeft } from "lucide-react-native";
import { useEffect } from "react";
import { KeyboardAvoidingView, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "store/hooks";

export default function PopoutChat({ route }) {
  const user = route.params?.user;
  if (typeof user !== "string") {
    return (
      <View
        style={[
          zero.flex.values[1],
          zero.layout.flex.justify.center,
          zero.layout.flex.align.center,
        ]}
      >
        <Text style={[zero.text.white]}>No user specified</Text>
      </View>
    );
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
  const navigation = useNavigation();
  useEffect(() => {
    setSrc(user);
  }, [user]);
  const safe = useSafeAreaInsets();
  const kb = useKeyboard();
  return (
    <KeyboardAvoidingView
      style={[
        {
          position: "relative",
          marginTop: safe.top,
          marginBottom: safe.bottom + kb.keyboardHeight,
          marginLeft: safe.left,
          marginRight: safe.right,
        },
        zero.flex.values[1],
        zero.m[2],
      ]}
    >
      <View style={[zero.flex.values[1]]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            zero.layout.flex.row,
            zero.layout.flex.align.center,
            zero.p[3],
            zero.mb[2],
            {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
            },
          ]}
        >
          <ArrowLeft size={20} color="white" />
          <Text style={[zero.text.white, zero.ml[2]]}>Go Back</Text>
        </Pressable>
        <View style={[zero.flex.values[1], zero.p[4]]}>
          <Chat canModerate={profile?.handle === user} />
          {profile && <ChatBox emojiData={emojiData} isPopout={true} />}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
