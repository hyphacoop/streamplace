import {
  PlayerProtocol,
  PlayerStatus,
  usePlayerStore,
  useStreamplaceStore,
} from "@streamplace/components";
import { useVideoPlayer, VideoPlayerEvents, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { MediaStream, RTCView } from "react-native-webrtc";
import { View } from "tamagui";
import { srcToUrl } from "../player/shared";
import useWebRTC from "../player/use-webrtc";

export default function VideoNative() {
  const protocol = usePlayerStore((x) => x.protocol);

  return (
    <View>
      {protocol === PlayerProtocol.WEBRTC ? <NativeWHEP /> : <NativeVideo />}
    </View>
  );
}

export function NativeVideo() {
  const videoRef = useRef<VideoView | null>(null);
  const protocol = usePlayerStore((x) => x.protocol);

  const selectedRendition = usePlayerStore((x) => x.selectedRendition);
  const src = usePlayerStore((x) => x.src);
  const { url } = srcToUrl({ src: src, selectedRendition }, protocol);
  const setStatus = usePlayerStore((x) => x.setStatus);
  const muted = usePlayerStore((x) => x.muted);
  const volume = usePlayerStore((x) => x.volume);
  const setFullscreen = usePlayerStore((x) => x.setFullscreen);
  const fullscreen = usePlayerStore((x) => x.fullscreen);
  const playerEvent = usePlayerStore((x) => x.playerEvent);
  const spurl = useStreamplaceStore((x) => x.url);

  const setPlayerWidth = usePlayerStore((x) => x.setPlayerWidth);
  const setPlayerHeight = usePlayerStore((x) => x.setPlayerHeight);

  // State for live dimensions
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    setPlayerWidth(width);
    setPlayerHeight(height);
  }, []);

  useEffect(() => {
    return () => {
      setStatus(PlayerStatus.START);
    };
  }, [setStatus]);

  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.muted = muted;
    player.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    player.volume = volume;
  }, [volume, player]);

  useEffect(() => {
    const subs = (
      [
        "playToEnd",
        "playbackRateChange",
        "playingChange",
        "sourceChange",
        "statusChange",
        "volumeChange",
      ] as (keyof VideoPlayerEvents)[]
    ).map((evType) => {
      return player.addListener(evType, (...args) => {
        const now = new Date();
        playerEvent(spurl, now.toISOString(), evType, { args: args });
      });
    });

    subs.push(
      player.addListener("playingChange", (newIsPlaying) => {
        if (newIsPlaying) {
          setStatus(PlayerStatus.PLAYING);
        } else {
          setStatus(PlayerStatus.WAITING);
        }
      }),
    );

    return () => {
      for (const sub of subs) {
        sub.remove();
      }
    };
  }, [player, playerEvent, setStatus, spurl]);

  return (
    <>
      <VideoView
        ref={videoRef}
        player={player}
        allowsFullscreen
        nativeControls={fullscreen}
        onFullscreenEnter={() => {
          setFullscreen(true);
        }}
        onFullscreenExit={() => {
          setFullscreen(false);
        }}
        allowsPictureInPicture
        onLayout={handleLayout}
      />
    </>
  );
}

export function NativeWHEP() {
  const selectedRendition = usePlayerStore((x) => x.selectedRendition);
  const src = usePlayerStore((x) => x.src);
  const { url } = srcToUrl(
    { src: src, selectedRendition },
    PlayerProtocol.WEBRTC,
  );
  const [stream, stuck] = useWebRTC(url);

  const setPlayerWidth = usePlayerStore((x) => x.setPlayerWidth);
  const setPlayerHeight = usePlayerStore((x) => x.setPlayerHeight);

  // PiP support: wire up videoRef (no direct ref for RTCView)
  const setVideoRef = usePlayerStore((x) => x.setVideoRef);

  // State for live dimensions
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    setPlayerWidth(width);
    setPlayerHeight(height);
  }, []);

  const setStatus = usePlayerStore((x) => x.setStatus);
  const muted = usePlayerStore((x) => x.muted);
  const volume = usePlayerStore((x) => x.volume);

  useEffect(() => {
    if (stuck) {
      setStatus(PlayerStatus.STALLED);
    } else {
      setStatus(PlayerStatus.PLAYING);
    }
  }, [stuck, setStatus]);

  const mediaStream = stream as unknown as MediaStream;

  useEffect(() => {
    if (!mediaStream) {
      setStatus(PlayerStatus.WAITING);
      return;
    }
    setStatus(PlayerStatus.PLAYING);
  }, [mediaStream, setStatus]);

  useEffect(() => {
    if (!mediaStream) {
      return;
    }
    mediaStream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        track._setVolume(muted ? 0 : volume);
      }
    });
  }, [mediaStream, muted, volume]);

  // Keep the playerStore videoRef in sync for PiP (if possible)
  useEffect(() => {
    if (typeof setVideoRef === "function") {
      setVideoRef(null); // No direct ref for RTCView, but keep API consistent
    }
  }, [setVideoRef]);

  if (!mediaStream) {
    return <View></View>;
  }

  return (
    <>
      <RTCView
        mirror={false}
        objectFit={"contain"}
        streamURL={mediaStream.toURL()}
        onLayout={handleLayout}
      />
    </>
  );
}
