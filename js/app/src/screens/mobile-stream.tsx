import { useNavigation } from "@react-navigation/native";
import { theme } from "@streamplace/components";
import KeepAwake from "components/keep-awake";
import { Player } from "components/mobile/player";
import { PlayerProps } from "components/player/props";
import { FullscreenProvider } from "contexts/FullscreenContext";
import { isWeb } from "tamagui";
import { queryToProps } from "./util";

export default function MobileStream({ route }) {
  const { user, protocol, url } = route.params;
  const navigation = useNavigation();
  let extraProps: Partial<PlayerProps> = {};
  if (isWeb) {
    extraProps = queryToProps(new URLSearchParams(window.location.search));
  }
  let src = user;
  if (user === "stream") {
    src = url;
  }

  console.log(src);

  return (
    <theme.ThemeProvider>
      <KeepAwake />
      <FullscreenProvider>
        <Player src={src} {...extraProps} />
      </FullscreenProvider>
    </theme.ThemeProvider>
  );
}
