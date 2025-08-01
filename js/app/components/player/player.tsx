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
import { useEffect, useState } from "react";
import { Text, View } from "tamagui";
import { Fullscreen } from "./fullscreen";
import { PlayerProps } from "./props";

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
      </PlayerProvider>
    </LivestreamProvider>
  );
}

export function PropUpFullscreen(props: {
  setFullscreen?: (fullscreen: boolean) => void;
  ingest?: boolean;
}) {
  const fullscreen = usePlayerStore((x) => x.fullscreen);

  useEffect(() => {
    if (props.setFullscreen) {
      props.setFullscreen(fullscreen);
    }
  }, [fullscreen, props.setFullscreen]);

  return <></>;
}

export function PlayerInner(props: Partial<PlayerProps>) {
  // Will get the first player ID from the store
  const playerId = getFirstPlayerID();

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

  return (
    <View f={1} justifyContent="center" position="relative">
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
