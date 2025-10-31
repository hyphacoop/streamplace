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
import { DesktopUi } from "components/mobile/desktop-ui";
import { useEffect, useState } from "react";
import { Image, Platform, useWindowDimensions } from "react-native";

const isWeb = Platform.OS === "web";

const { bg, borders, flex, gap, h, layout, mb, mt, mx, p, px, py, r, text, w } =
  zero;

const DEFAULT_SOURCE = "iame.li";

export function UserOffline() {
  const profile = useLivestreamStore((x) => x.profile);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 1250;

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
        isSmallScreen ? layout.flex.alignCenter : layout.flex.center,
        mt[12],
      ]}
    >
      {/* Banner Background */}
      {detailedProfile?.banner && (
        <Image
          source={{ uri: detailedProfile.banner }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: 0.15,
          }}
        />
      )}

      <View
        style={[
          isSmallScreen ? mt[8] : layout.flex.row,
          gap.all[6],
          layout.flex.center,
          isSmallScreen ? px[4] : px[0],
        ]}
      >
        <View
          style={[
            w.percent[100],
            isSmallScreen ? h.auto : h.percent[100],
            isSmallScreen ? { maxWidth: "100%" } : { maxWidth: 400 },
            px[8],
            py[6],
            bg.neutral[900],
            r.lg,
            borders.color.neutral[800],
            borders.width.thin,
            gap.row[6],
            layout.flex.justify.center,
          ]}
        >
          <Text size="xl">
            @{profile.handle} is{" "}
            <Text size="xl" style={[text.gray[400]]}>
              offline
            </Text>
            , but they recommend checking out:
          </Text>
          <View>
            <Text style={[text.gray[300]]}>@iame.li</Text>
            <Text style={[text.gray[300]]}>
              Just Chatting · {guestViewerCount} viewers
            </Text>
          </View>
        </View>
        <View
          style={[
            w.percent[100],
            isSmallScreen
              ? { maxWidth: "100%", aspectRatio: 16 / 9 }
              : { maxWidth: 650, aspectRatio: 16 / 9 },
            overflow.hidden,
            r.lg,
            overflow.hidden,
            borders.color.neutral[800],
            borders.width.thin,
            gap.row[2],
          ]}
        >
          <LivestreamProvider src={DEFAULT_SOURCE} ignoreOuterContext>
            <PlayerProvider>
              <Player src={DEFAULT_SOURCE} embedded={true}>
                <DesktopUi />
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
