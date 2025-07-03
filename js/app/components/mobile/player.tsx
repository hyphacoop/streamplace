import { useNavigation } from "@react-navigation/native";
import {
  Button,
  layout,
  LivestreamProvider,
  Player as PlayerInner,
  PlayerProps,
  PlayerProvider,
  Text,
  View,
} from "@streamplace/components";
import { gap, h, pt, w } from "@streamplace/components/src/lib/theme/atoms";
import { ArrowLeft, ArrowRight } from "@tamagui/lucide-icons";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { useLiveUser } from "hooks/useLiveUser";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { MobileUi } from "./ui";

export function Player(
  props: Partial<PlayerProps> & {
    setFullscreen?: (fullscreen: boolean) => void;
  },
) {
  const [isStreamingElsewhere, setIsStreamingElsewhere] = useState<
    boolean | null
  >(null);
  // are we currently streaming on another device?
  const userIsLive = useLiveUser();
  const userProfile = useAppSelector(selectUserProfile);

  useEffect(() => {
    console.log("user is live changed to", userIsLive);
    if (props.ingest && userIsLive && isStreamingElsewhere === null) {
      setIsStreamingElsewhere(true);
    } else if (props.ingest && userIsLive === false) {
      setIsStreamingElsewhere(false);
    }
  }, [userIsLive]);

  const navigation = useNavigation();

  console.log(isStreamingElsewhere);
  if (isStreamingElsewhere) {
    return (
      <View style={[layout.flex.center, h.percent[100], gap.all[4]]}>
        <Text weight="semibold" size="3xl" style={[pt[2]]}>
          Oeps!
        </Text>
        <View>
          <Text center>You're already streaming from another device.</Text>
          <Text>Please end your other stream before starting one here.</Text>
        </View>
        <View
          style={[
            layout.flex.row,
            w.percent[100],
            gap.column[2],
            layout.flex.center,
          ]}
        >
          <Button
            variant="secondary"
            style={[w.percent[40]]}
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home", { screen: "StreamList" })
            }
          >
            <View
              centered
              style={[layout.flex.center, layout.flex.row, gap.all[1]]}
            >
              <ArrowLeft />
              <Text>Back</Text>
            </View>
          </Button>
          {userProfile?.did && (
            <Button
              style={[w.percent[40]]}
              onPress={() =>
                navigation.navigate("MobileStream", { user: userProfile?.did })
              }
            >
              <View
                centered
                style={[layout.flex.center, layout.flex.row, gap.all[1]]}
              >
                <Text>Your stream</Text>
                <ArrowRight />
              </View>
            </Button>
          )}
        </View>
      </View>
    );
  }
  return (
    <LivestreamProvider src={props.src ?? ""}>
      <PlayerProvider defaultId={props.playerId || undefined}>
        <PlayerInner {...props} />
        <MobileUi />
      </PlayerProvider>
    </LivestreamProvider>
  );
}
