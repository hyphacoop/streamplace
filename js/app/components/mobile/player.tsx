import {
  LivestreamProvider,
  Player as PlayerInner,
  PlayerProps,
  PlayerProvider,
} from "@streamplace/components";
import { MobileUi } from "./ui";

export function Player(
  props: Partial<PlayerProps> & {
    setFullscreen?: (fullscreen: boolean) => void;
  },
) {
  return (
    <LivestreamProvider src={props.src ?? ""}>
      <PlayerProvider defaultId={props.playerId || undefined}>
        <PlayerInner {...props} />
        <MobileUi />
      </PlayerProvider>
    </LivestreamProvider>
  );
}
