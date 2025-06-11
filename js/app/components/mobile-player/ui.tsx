import { useNavigation } from "@react-navigation/native";
import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { Text, View } from "@streamplace/components/src/components/ui";
import { layout } from "@streamplace/components/src/lib/theme";
import {
  gap,
  h,
  position,
  w,
  zIndex,
} from "@streamplace/components/src/lib/theme/atoms";
import { ChevronLeft } from "@tamagui/lucide-icons";
import Chat from "components/chat/chat";
import ChatBox from "components/chat/chat-box";
import useAvatars from "hooks/useAvatars";
import { Dimensions, Image, Pressable } from "react-native";
export function MobileUi() {
  const ingest = usePlayerStore((x) => x.ingestConnectionState) !== null;
  const profile = useLivestreamStore((x) => x.profile);
  const pHeight = Number(usePlayerStore((x) => x.playerHeight)) || 0;
  const pWidth = Number(usePlayerStore((x) => x.playerWidth)) || 0;
  const { width, height } = Dimensions.get("window");

  const navigation = useNavigation();

  const avatars = useAvatars([profile?.did!])[profile?.did!];

  // if player dimension ratio > window ratio, then false
  const isPlayerRatioGreater = pWidth / pHeight > width / height;

  return (
    <>
      <View
        style={[
          {
            padding: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: 8,
          },
          layout.position.absolute,
          zIndex[40],
        ]}
      >
        <View style={[layout.flex.row, layout.flex.center, gap.all[2]]}>
          <Pressable
            onPress={() => {
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home", { screen: "StreamList" });
            }}
          >
            <ChevronLeft />
          </Pressable>
          <Image
            source={avatars?.avatar || require("assets/images/goose.png")}
            width={32}
            height={32}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "green",
            }}
          />
          <Text>{profile?.handle}</Text>
        </View>
      </View>
      <View
        style={[
          h.percent[30],
          isPlayerRatioGreater
            ? layout.position.relative
            : layout.position.absolute,
          position.bottom[0],
          zIndex[10],
          w.percent[100],
        ]}
      >
        <Chat isChatVisible={true} setIsChatVisible={() => true} />
        <ChatBox />
      </View>
    </>
  );
}
