import { useNavigation } from "@react-navigation/native";
import {
  LivestreamProvider,
  Player,
  PlayerProvider,
  Text,
  useAvatars,
  useLivestreamStore,
  View,
  zero,
} from "@streamplace/components";
import { overflow } from "@streamplace/components/src/lib/theme/atoms";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, useWindowDimensions } from "react-native";
import { DesktopUi } from "./desktop-ui";

const { bg, borders, flex, gap, h, layout, mt, position, px, py, r, text, w } =
  zero;

const DEFAULT_SOURCE = "justinmakaila.com";

export function UserOffline() {
  const navigation = useNavigation();
  const profile = useLivestreamStore((x) => x.profile);
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 1250;
  const isLandscape = width > height;
  const useCompactLayout = isSmallScreen && !isLandscape;

  const [guestViewerCount, getViewerCount] = useState(null);

  const pfp = useAvatars(profile ? [profile?.did] : []);

  // use the detailed profile from useAvatars
  const detailedProfile = profile ? pfp[profile?.did] : null;

  if (!profile) {
    return (
      <View style={[flex.values[1], bg.gray[900], layout.flex.center]}>
        <Text size="2xl" color="muted">
          user is offline
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        flex.values[1],
        useCompactLayout ? layout.flex.alignCenter : layout.flex.center,
        useCompactLayout ? mt[12] : mt[4],
      ]}
    >
      {/* Back Button and Profile */}
      {Platform.OS !== "web" && (
        <View
          style={[
            {
              padding: 3,
              paddingRight: 8,
              backgroundColor: "rgba(90,90,90, 0.25)",
              borderRadius: 12,
              alignSelf: "flex-start",
              zIndex: 100,
            },
            r.lg,
            layout.position.absolute,
            position.left[4],
            useCompactLayout ? position.top[4] : position.top[0],
          ]}
        >
          <View style={[layout.flex.row, layout.flex.center, gap.all[2]]}>
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [
                      { name: "Home", params: { screen: "StreamList" } },
                    ],
                  });
                }
              }}
            >
              <ChevronLeft color="white" />
            </Pressable>
            <Image
              source={
                profile?.did
                  ? { uri: detailedProfile?.avatar }
                  : require("assets/images/goose.png")
              }
              style={[
                {
                  width: 36,
                  height: 36,
                  backgroundColor: "green",
                },
                { borderRadius: 999 },
                borders.width.thin,
                borders.color.gray[700],
              ]}
            />
            <Text>{profile?.handle}</Text>
          </View>
        </View>
      )}
      {/* Banner Background */}
      {detailedProfile?.banner && (
        <Image
          source={{ uri: detailedProfile.banner }}
          style={[
            {
              position: "absolute",
              top: -50,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "110%",
              opacity: 0.15,
            },
          ]}
        />
      )}

      <View
        style={[
          useCompactLayout ? mt[20] : layout.flex.row,
          gap.all[isLandscape && isSmallScreen ? 3 : 6],
          layout.flex.center,
          px[4],
        ]}
      >
        <View
          style={[
            isLandscape && isSmallScreen ? { width: 280 } : w.percent[100],
            useCompactLayout ? h.auto : h.percent[100],
            useCompactLayout
              ? { maxWidth: "100%" }
              : isLandscape && isSmallScreen
                ? { maxWidth: 280 }
                : { maxWidth: 400 },
            isLandscape && isSmallScreen ? px[4] : px[8],
            isLandscape && isSmallScreen ? py[3] : py[6],
            bg.neutral[900],
            r.lg,
            borders.color.neutral[800],
            borders.width.thin,
            gap.row[isLandscape && isSmallScreen ? 3 : 6],
            layout.flex.justify.center,
          ]}
        >
          <Text size={isLandscape && isSmallScreen ? "base" : "xl"}>
            @{profile.handle} is{" "}
            <Text
              size={isLandscape && isSmallScreen ? "base" : "xl"}
              style={[text.gray[400]]}
            >
              offline
            </Text>
            , but we recommend checking out:
          </Text>
          <View>
            <Text style={[text.gray[300]]}>@{DEFAULT_SOURCE}</Text>
            <Text style={[text.gray[300]]}>{guestViewerCount} viewers</Text>
          </View>
        </View>
        <View
          style={[
            useCompactLayout
              ? [w.percent[100], { maxWidth: "100%", aspectRatio: 16 / 9 }]
              : [
                  flex.values[1],
                  {
                    aspectRatio: 16 / 9,
                    ...(!(isLandscape && isSmallScreen) && {
                      maxWidth: 650,
                      minWidth: 650,
                    }),
                  },
                ],
            overflow.hidden,
            r.lg,
            overflow.hidden,
            borders.color.neutral[800],
            borders.width.thin,
            bg.black,
            gap.row[2],
          ]}
        >
          <LivestreamProvider src={DEFAULT_SOURCE} ignoreOuterContext>
            <PlayerProvider>
              <Player src={DEFAULT_SOURCE} embedded={true}>
                <DesktopUi setIsChatOpen={undefined} />
                <GetViewerCount setViewerCount={getViewerCount} />
              </Player>
            </PlayerProvider>
          </LivestreamProvider>
        </View>
      </View>
    </View>
  );
}

const GetViewerCount = ({ setViewerCount }) => {
  const viewers = useLivestreamStore((x) => x.viewers);

  useEffect(() => {
    setViewerCount(viewers);
  }, [viewers]);

  return null;
};
