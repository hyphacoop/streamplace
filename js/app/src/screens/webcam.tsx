import { Player } from "components/player/player";
import { queryToProps } from "./util";
import Loading from "components/loading/loading";
import {
  selectIsReady,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { useAppSelector } from "store/hooks";
import { Redirect } from "components/aqlink";

export default function StreamScreen() {
  const isReady = useAppSelector(selectIsReady);
  if (!isReady) {
    return <Loading />;
  }
  const userProfile = useAppSelector(selectUserProfile);
  if (!userProfile) {
    return <Redirect to={{ screen: "Login" }} />;
  }
  const params = new URLSearchParams(window.location.search);
  return <Player ingest={true} src="live" {...queryToProps(params)} />;
}
