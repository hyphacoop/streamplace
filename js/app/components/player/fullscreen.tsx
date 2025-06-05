import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { useFullscreen } from "contexts/FullscreenContext";
import { useEffect, useRef } from "react";
import { TamaguiElement, View } from "tamagui";
import Controls from "./controls";
import PlayerLoading from "./player-loading";
import Video from "./video";
import VideoRetry from "./video-retry";

export function Fullscreen(props: { playerId: string; src: string }) {
  const playerId = props.playerId;
  const protocol = usePlayerStore((x) => x.protocol, playerId);
  const fullscreen = usePlayerStore((x) => x.fullscreen, playerId);
  const setSrc = usePlayerStore((x) => x.setSrc);
  const { setFullscreen } = useFullscreen();

  const handle = useLivestreamStore((x) => x.profile?.handle);

  const divRef = useRef<TamaguiElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setFullscreen(fullscreen);
  }, [fullscreen]);

  useEffect(() => {
    setSrc(props.src);
  }, [props.src]);

  useEffect(() => {
    if (!divRef.current) {
      return;
    }
    (async () => {
      if (fullscreen && !document.fullscreenElement) {
        try {
          const div = divRef.current as HTMLDivElement;
          if (typeof div.requestFullscreen === "function") {
            await div.requestFullscreen();
          } else if (videoRef.current) {
            if (
              typeof (videoRef.current as any).webkitEnterFullscreen ===
              "function"
            ) {
              await (videoRef.current as any).webkitEnterFullscreen();
            } else if (
              typeof videoRef.current.requestFullscreen === "function"
            ) {
              await videoRef.current.requestFullscreen();
            }
          }
          setFullscreen(true);
        } catch (e) {
          console.error("fullscreen failed", e.message);
        }
      }
      if (!fullscreen) {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (e) {
            console.error("fullscreen exit failed", e.message);
          }
        }
        setFullscreen(false);
      }
    })();
  }, [fullscreen, protocol]);

  useEffect(() => {
    const listener = () => {
      console.log("fullscreenchange", document.fullscreenElement);
      setFullscreen(!!document.fullscreenElement);
    };
    document.body.addEventListener("fullscreenchange", listener);
    document.body.addEventListener("webkitfullscreenchange", listener);
    return () => {
      document.body.removeEventListener("fullscreenchange", listener);
      document.body.removeEventListener("webkitfullscreenchange", listener);
    };
  }, []);

  return (
    <View flex={1} ref={divRef}>
      <PlayerLoading />
      <Controls name={handle || "Streaming"} playerId={props.playerId} />
      <VideoRetry>
        <Video />
      </VideoRetry>
    </View>
  );
}
