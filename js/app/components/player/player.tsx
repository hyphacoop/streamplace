import {
  getFirstPlayerID,
  usePlayerStore,
  useSegment,
} from "@streamplace/components";
import usePlatform from "hooks/usePlatform";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect, useState } from "react";
import { Text, View } from "tamagui";
import { Fullscreen } from "./fullscreen";
import {
  PlayerEvent,
  PlayerProps,
  PlayerStatus,
  PlayerStatusTracker,
} from "./props";
import PlayerProvider from "./provider";

const OFFLINE_THRESHOLD = 10000;

export function Player(
  props: Partial<PlayerProps> & {
    setFullscreen?: (fullscreen: boolean) => void;
  },
) {
  return (
    <PlayerProvider {...props}>
      <PropUpFullscreen setFullscreen={props.setFullscreen} />
      <PlayerInner {...props} />
    </PlayerProvider>
  );
}

export function PropUpFullscreen(props: {
  setFullscreen?: (fullscreen: boolean) => void;
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

  const { url } = useStreamplaceNode();
  const info = usePlatform();

  const playing = usePlayerStore((x) => x.status === PlayerStatus.PLAYING);

  const setOffline = usePlayerStore((x) => x.setOffline);

  if (typeof props.src !== "string") {
    return (
      <View>
        <Text>No source provided 🤷</Text>
      </View>
    );
  }
  const playerEvent = async (
    time: string,
    eventType: string,
    meta: { [key: string]: any },
  ) => {
    if (props.telemetry !== true) {
      return;
    }
    const data: PlayerEvent = {
      time: time,
      playerId: playerId,
      eventType: eventType,
      meta: {
        ...meta,
        ...info,
      },
    };
    try {
      await fetch(`${url}/api/player-event`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("error sending player telemetry", e);
    }
  };

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
    <View f={1} justifyContent="center" position="relative">
      <Fullscreen playerId={playerId} src={props.src}></Fullscreen>
    </View>
  );
}

const POLL_INTERVAL = 5000;
export function usePlayerStatus(
  playerEvent: (
    time: string,
    eventType: string,
    meta: { [key: string]: any },
  ) => Promise<void>,
): [PlayerStatus, (status: PlayerStatus) => void] {
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
  const updateStatus = (status: PlayerStatus) => {
    const now = new Date();
    if (status !== whatDoing) {
      setWhatDid(updateWhatDid(now));
      setWhatDoing(status);
      setDoingSince(now.getTime());
    }
  };

  useEffect(() => {
    if (lastUpdated === 0) {
      return;
    }
    const now = new Date();
    const fullWhatDid = updateWhatDid(now);
    setWhatDid({} as PlayerStatusTracker);
    setDoingSince(now.getTime());
    playerEvent(now.toISOString(), "aq-played", {
      whatHappened: fullWhatDid,
    });
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval((_) => {
      setLastUpdated(Date.now());
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
  return [whatDoing, updateStatus];
}
