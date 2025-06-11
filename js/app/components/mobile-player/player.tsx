import {
  getFirstPlayerID,
  LivestreamProvider,
  PlayerProvider,
  PlayerStatus,
  PlayerStatusTracker,
  usePlayerStore,
  useSegment,
  useStreamplaceStore,
} from "@streamplace/components";
import { Text, View } from "@streamplace/components/src/components/ui";
import {
  flex,
  layout,
  w,
  zIndex,
} from "@streamplace/components/src/lib/theme/atoms";
import { useEffect, useState } from "react";
import { Fullscreen } from "./fullscreen";
import { PlayerProps } from "./props";
import { MobileUi } from "./ui";

const OFFLINE_THRESHOLD = 10000;

export function Player(
  props: Partial<PlayerProps> & {
    setFullscreen?: (fullscreen: boolean) => void;
  },
) {
  return (
    <LivestreamProvider src={props.src ?? ""}>
      <PlayerProvider defaultId={props.playerId || undefined}>
        <PropUpFullscreen setFullscreen={props.setFullscreen} />
        <PlayerInner {...props} />
        <MobileUi />
      </PlayerProvider>
    </LivestreamProvider>
  );
}

export function PropUpFullscreen(props: {
  setFullscreen?: (fullscreen: boolean) => void;
  ingest?: boolean;
}) {
  const fullscreen = usePlayerStore((x) => x.fullscreen);
  const ref = usePlayerStore((x) => x.videoRef);

  useEffect(() => {
    if (props.setFullscreen) {
      props.setFullscreen(fullscreen);
    }
  }, [fullscreen, props.setFullscreen]);

  // get height/width and print out
  useEffect(() => {
    if (ref && typeof ref != "function" && ref.current) {
      console.log(
        "Video dimensions:",
        ref.current.videoWidth,
        ref.current.videoHeight,
      );
    } else if (ref && typeof ref === "function") {
      // If ref is a function, we can't access videoWidth/Height directly
      console.warn(
        "Video ref is a function, cannot access dimensions directly.",
      );
    } else {
      console.warn("Video ref is not set or is invalid.");
    }
  }, [ref]);

  return <></>;
}

export function PlayerInner(props: Partial<PlayerProps>) {
  // Will get the first player ID from the store
  const playerId = getFirstPlayerID();

  const playing = usePlayerStore((x) => x.status === PlayerStatus.PLAYING);

  const setOffline = usePlayerStore((x) => x.setOffline);
  const setIngest = usePlayerStore((x) => x.setIngestConnectionState);

  const clearControlsTimeout = usePlayerStore((x) => x.clearControlsTimeout);

  // Will call back every few seconds to send health updates
  usePlayerStatus();

  useEffect(() => {
    setIngest(props.ingest ? "new" : null);
  }, []);

  if (typeof props.src !== "string") {
    return (
      <View>
        <Text>No source provided 🤷</Text>
      </View>
    );
  }

  useEffect(() => {
    return () => {
      clearControlsTimeout();
    };
  }, []);

  const segment = useSegment();
  const [lastCheck, setLastCheck] = useState(0);

  useEffect(() => {
    if (playing) {
      setOffline(false);
      return;
    }
    if (!segment) {
      setOffline(false);
      return;
    }
    const startTime = Date.parse(segment.startTime);
    if (!startTime) {
      console.error("startTime is not a number", segment.startTime);
      return;
    }
    const timeSinceStart = Date.now() - startTime;
    if (timeSinceStart > OFFLINE_THRESHOLD) {
      setOffline(true);
      return;
    }
    const handle = setTimeout(() => {
      setLastCheck(Date.now());
    }, 1000);
    return () => clearTimeout(handle);
  }, [segment, playing, lastCheck]);

  return (
    <View
      style={[zIndex[10], flex.values[1], w.percent[100], layout.flex.center]}
    >
      <Fullscreen playerId={playerId} src={props.src}></Fullscreen>
    </View>
  );
}

const POLL_INTERVAL = 5000;
export function usePlayerStatus(): [PlayerStatus] {
  const playerStatus = usePlayerStore((x) => x.status);
  const url = useStreamplaceStore((x) => x.url);
  const playerEvent = usePlayerStore((x) => x.playerEvent);
  const [whatDoing, setWhatDoing] = useState<PlayerStatus>(PlayerStatus.START);
  const [whatDid, setWhatDid] = useState<PlayerStatusTracker>({});
  const [doingSince, setDoingSince] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState(0);
  const updateWhatDid = (now: Date): PlayerStatusTracker => {
    const prev = whatDid[whatDoing] ?? 0;
    const duration = now.getTime() - doingSince;
    const ret = {
      ...whatDid,
      [whatDoing]: prev + duration,
    };
    return ret;
  };
  // callback to update the status
  useEffect(() => {
    const now = new Date();
    if (playerStatus !== whatDoing) {
      setWhatDid(updateWhatDid(now));
      setWhatDoing(playerStatus);
      setDoingSince(now.getTime());
    }
  }, [playerStatus]);

  useEffect(() => {
    if (lastUpdated === 0) {
      return;
    }
    const now = new Date();
    const fullWhatDid = updateWhatDid(now);
    setWhatDid({} as PlayerStatusTracker);
    setDoingSince(now.getTime());
    playerEvent(url, now.toISOString(), "aq-played", {
      whatHappened: fullWhatDid,
    });
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval((_) => {
      setLastUpdated(Date.now());
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
  return [whatDoing];
}
