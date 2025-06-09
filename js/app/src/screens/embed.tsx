import { Player } from "components";
import { PlayerProps } from "components/player/props";
import {
  setSidebarHidden,
  setSidebarUnhidden,
} from "features/base/sidebarSlice";
import { useEffect } from "react";
import { useAppDispatch } from "store/hooks";
import { isWeb } from "tamagui";
import { queryToProps } from "./util";

export default function EmbedScreen({ route }) {
  const { user, protocol, url } = route.params;
  let extraProps: Partial<PlayerProps> = {};
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setSidebarHidden());
    () => {
      // on unmount, unhide the sidebar
      dispatch(setSidebarUnhidden());
    };
  }, []);
  if (isWeb) {
    extraProps = queryToProps(new URLSearchParams(window.location.search));
  }
  let src = user;
  if (user === "stream") {
    src = url;
  }
  return <Player src={src} embedded={true} {...extraProps} />;
}
