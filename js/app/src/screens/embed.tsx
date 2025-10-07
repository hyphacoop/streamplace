import {
  LivestreamProvider,
  Player,
  PlayerProps,
  PlayerProvider,
} from "@streamplace/components";
import { DesktopUi } from "components/mobile/desktop-ui";
import {
  setSidebarHidden,
  setSidebarUnhidden,
} from "features/base/sidebarSlice";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useAppDispatch } from "store/hooks";
import { queryToProps } from "./util";

const isWeb = Platform.OS === "web";

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
  return (
    <LivestreamProvider src={src}>
      <PlayerProvider {...extraProps}>
        <Player src={src} {...extraProps}>
          <DesktopUi />
        </Player>
      </PlayerProvider>
    </LivestreamProvider>
  );
}
