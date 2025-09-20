import { KeepAwake } from "@streamplace/components";
import { Player } from "components/mobile/player";
import { PlayerProps } from "components/player/props";
import { FullscreenProvider } from "contexts/FullscreenContext";
import useTitle from "hooks/useTitle";
import { Platform } from "react-native";
import { queryToProps } from "./util";

const isWeb = Platform.OS === "web";

export default function MobileStream({ route }) {
  const { user, protocol, url } = route.params;
  let extraProps: Partial<PlayerProps> = {};
  if (isWeb) {
    extraProps = queryToProps(new URLSearchParams(window.location.search));
  }
  let src = user;
  if (user === "stream") {
    src = url;
  }

  useTitle(user);

  return (
    <>
      <KeepAwake />
      <FullscreenProvider>
        <Player src={src} {...extraProps} />
      </FullscreenProvider>
    </>
  );
}
