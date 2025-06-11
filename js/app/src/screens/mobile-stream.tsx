import { useNavigation } from "@react-navigation/native";
import { ThemeProvider } from "@streamplace/components/src/lib/theme";
import { Player } from "components/mobile-player/player";
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
    <ThemeProvider>
      <FullscreenProvider>
        <Player src={src} {...extraProps} />
      </FullscreenProvider>
    </ThemeProvider>
  );
}
