// basically PlayerProvider that sets up our magic context,

import {
  LivestreamProvider,
  PlayerProvider as NewPlayerProvider,
} from "@streamplace/components";
import { PlayerProps } from "./props";

// PlayerInner starts doing player stuff
export default function PlayerProvider(
  props: Partial<PlayerProps> & { children: React.ReactNode },
): React.ReactNode {
  return (
    <NewPlayerProvider>
      <LivestreamProvider src={props.src ?? ""}>
        {props.children}
      </LivestreamProvider>
    </NewPlayerProvider>
  );
}
