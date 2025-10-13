import { useNavigation } from "@react-navigation/native";
import {
  PlayerUI,
  Text,
  View,
  useAvatars,
  useCameraToggle,
  useLivestreamInfo,
  zero,
} from "@streamplace/components";
import { ChevronLeft, MessageSquare, SwitchCamera } from "lucide-react-native";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { LiveBubble } from "./live-bubble";

const { borders, colors, gap, layout, p, px, py, r, text } = zero;

interface TopControlBarProps {
  offline: boolean;
  isActivelyLive: boolean;
  ingest: string | null;
  isChatOpen: boolean;
  onToggleChat: () => void;
  safeAreaInsets: { top: number };
  embedded?: boolean;
}

export function TopControlBar({
  offline,
  isActivelyLive,
  ingest,
  isChatOpen,
  onToggleChat,
  safeAreaInsets,
  embedded = false,
}: TopControlBarProps) {
  const navigation = useNavigation();
  const { profile } = useLivestreamInfo();
  const { doSetIngestCamera } = useCameraToggle();
  const avatars = useAvatars(profile?.did ? [profile?.did] : []);
  const { width } = useWindowDimensions();
  const isTinyScreen = width < 450;
  const isSmallScreen = width < 600;

  return (
    <View
      style={[
        layout.flex.row,
        layout.flex.spaceBetween,
        layout.flex.alignCenter,
      ]}
    >
      <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[3]]}>
        {Platform.OS !== "web" && (
          <Pressable
            onPress={() => {
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home", { screen: "StreamList" });
            }}
            style={[p[2], r[1]]}
          >
            <ChevronLeft color="white" size={24} />
          </Pressable>
        )}
        <Image
          source={
            profile?.did
              ? { uri: avatars[profile?.did]?.avatar }
              : require("assets/images/goose.png")
          }
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.gray[800],
            },
            borders.width.thin,
            borders.color.gray[700],
          ]}
        />

        <View style={[layout.flex.column]}>
          <Text style={[text.white, { fontSize: 16, fontWeight: "600" }]}>
            {profile?.handle}
          </Text>
          {!offline && <LiveBubble />}
        </View>
      </View>

      <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[3]]}>
        {embedded && Platform.OS === "web" && (
          <Pressable
            onPress={() => {
              const url = window.location.href.replace("/embed/", "/");
              Linking.openURL(url);
            }}
            style={[
              layout.flex.row,
              layout.flex.alignCenter,
              gap.all[2],
              py[2],
              px[3],
              r.xl,
              {
                backgroundColor: "rgba(75,75,75, 0.65)",
              },
            ]}
          >
            {!isSmallScreen && <Text size="lg">Powered by</Text>}
            <Image
              source={require("assets/images/cube_small.png")}
              style={{
                width: 24,
                height: 24,
              }}
            />
            {!isTinyScreen && <Text size="lg">Streamplace</Text>}
          </Pressable>
        )}
        {isActivelyLive && (
          <>
            <PlayerUI.Viewers />

            <Pressable onPress={onToggleChat} style={[p[2], r[1]]}>
              <MessageSquare
                size={20}
                color={isChatOpen ? colors.primary[500] : colors.white}
              />
            </Pressable>
          </>
        )}
        {ingest !== null && (
          <Pressable onPress={doSetIngestCamera} style={[p[2], r[1]]}>
            <SwitchCamera size={24} color={colors.gray[200]} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
