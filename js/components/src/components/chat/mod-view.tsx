import { TriggerRef } from "@rn-primitives/dropdown-menu";
import { forwardRef, useEffect, useRef } from "react";
import { gap, mr, w } from "../../lib/theme/atoms";
import { usePlayerStore } from "../../player-store";
import {
  useCreateBlockRecord,
  useCreateHideChatRecord,
} from "../../streamplace-store/block";
import { usePDSAgent } from "../../streamplace-store/xrpc";

import { Linking } from "react-native";
import { useStreamplaceStore } from "../../streamplace-store";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  layout,
  ResponsiveDropdownMenuContent,
  Text,
  View,
} from "../ui";
import { RenderChatMessage } from "./chat-message";

const BSKY_FRONTEND_DOMAIN = "bsky.app";

type ModViewProps = {
  onClose?: () => void;
  // onDeleteMessage?: (msg: ChatMessageViewHydrated) => void;
  // onBanUser?: (userHandle: string) => void;
};

export type ModViewRef = {
  open: () => void;
  close: () => void;
};

export const ModView = forwardRef<ModViewRef, ModViewProps>(() => {
  const triggerRef = useRef<TriggerRef>(null);
  const message = usePlayerStore((state) => state.modMessage);

  let agent = usePDSAgent();
  let createBlockRecord = useCreateBlockRecord();
  let createHideChatRecord = useCreateHideChatRecord();

  // get the channel did
  const channelId = usePlayerStore((state) => state.src);
  // get the logged in user's identity
  const handle = useStreamplaceStore((state) => state.handle);

  if (!agent?.did) {
    <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[2]]}>
      <Text>Log in to submit mod actions</Text>
    </View>;
  }

  useEffect(() => {
    if (message) {
      console.log("opening mod view");
      triggerRef.current?.open();
    } else {
      console.log("closing mod view");
      triggerRef.current?.close();
    }
  }, [message]);

  return (
    <DropdownMenu
      style={[layout.flex.row, layout.flex.alignCenter, gap.all[2], w[80]]}
    >
      <DropdownMenuTrigger ref={triggerRef}>
        {/* Hidden trigger */}
        <View />
      </DropdownMenuTrigger>
      <ResponsiveDropdownMenuContent>
        {message && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <View
                  style={[
                    layout.flex.column,
                    mr[5],
                    { gap: 6, maxWidth: "100%" },
                  ]}
                >
                  <RenderChatMessage item={message} />
                </View>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* TODO: Checking for non-owner moderators */}
            {channelId === handle && (
              <DropdownMenuGroup title={`Moderation actions`}>
                <DropdownMenuItem
                  disabled={message.author.did === agent?.did}
                  onPress={() => {
                    createHideChatRecord(message.uri)
                      .then((r) => console.log(r))
                      .catch((e) => console.error(e));
                  }}
                >
                  <Text color="destructive">Remove this message</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={message.author.did === agent?.did}
                  onPress={() => {
                    createBlockRecord(message.author.did)
                      .then((r) => console.log(r))
                      .catch((e) => console.error(e));
                  }}
                >
                  {message.author.did === agent?.did ? (
                    <Text color="muted">
                      Block yourself (you can't block yourself)
                    </Text>
                  ) : (
                    <Text color="destructive">
                      Block user @{message.author.handle} from this channel
                    </Text>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}

            <DropdownMenuGroup title={`User actions`}>
              <DropdownMenuItem
                onPress={() => {
                  Linking.openURL(
                    `https://${BSKY_FRONTEND_DOMAIN}/profile/${channelId}`,
                  );
                }}
              >
                <Text color="primary">View user on {BSKY_FRONTEND_DOMAIN}</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </ResponsiveDropdownMenuContent>
    </DropdownMenu>
  );
});
