import {
  LivestreamProvider,
  PlayerProvider,
  zero,
} from "@streamplace/components";
import { Redirect } from "components/aqlink";
import BentoGrid from "components/live-dashboard/bento-grid";
import Loading from "components/loading/loading";
import { VideoElementProvider } from "contexts/VideoElementContext";
import {
  selectIsReady,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { useLiveUser } from "hooks/useLiveUser";
import { useCallback, useState } from "react";
import { useAppSelector } from "store/hooks";

const { flex, bg } = zero;

export default function LiveDashboard() {
  const isReady = useAppSelector(selectIsReady);
  const userProfile = useAppSelector(selectUserProfile);
  const isLive = useLiveUser();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node !== null) {
      setVideoElement(node);
    }
  }, []);

  if (!isReady) {
    return <Loading />;
  }

  if (!userProfile) {
    return <Redirect to={{ screen: "Login" }} />;
  }

  return (
    <LivestreamProvider src={userProfile.did}>
      <VideoElementProvider videoElement={videoElement}>
        <PlayerProvider>
          <BentoGrid isLive={isLive} videoRef={videoRef} />
        </PlayerProvider>
      </VideoElementProvider>
    </LivestreamProvider>
  );
}
