import { TriggerRef } from "@rn-primitives/dropdown-menu";
import { forwardRef, useEffect, useRef } from "react";
import { gap, mr } from "../../lib/theme/atoms";
import { usePlayerStore } from "../../player-store";
import { useCreateBlockRecord } from "../../streamplace-store/block";
import { usePDSAgent } from "../../streamplace-store/xrpc";

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
    <DropdownMenu>
      <DropdownMenuTrigger ref={triggerRef}>
        {/* Hidden trigger */}
        <View />
      </DropdownMenuTrigger>
      <ResponsiveDropdownMenuContent>
        {message && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <View style={[layout.flex.column, mr[5], { gap: 6 }]}>
                  <RenderChatMessage item={message} />
                </View>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup title={`Moderation actions`}>
              {/* <DropdownMenuItem
                  onPress={
                    onDeleteMessage
                      ? () => onDeleteMessage(modMessage)
                      : undefined
                  }
                >
                  <Text customColor={colors.ios.systemTeal}>
                    Delete message
                  </Text>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onPress={
                    onBanUser
                      ? () => onBanUser(modMessage.author.handle)
                      : undefined
                  }
                >
                  <Text color="destructive">
                    Ban user @{modMessage.author.handle}
                  </Text>
                </DropdownMenuItem> */}
              <DropdownMenuItem
                disabled={message.author.did === agent?.did}
                onPress={() => {
                  console.log("Creating block record");
                  createBlockRecord(message.author.did)
                    .then((r) => console.log(r))
                    .catch((e) => console.error(e));
                }}
              >
                <Text color="destructive">
                  {message.author.did === agent?.did ? (
                    <>Block yourself (you can't block yourself)</>
                  ) : (
                    <>Block user @{message.author.handle} from this channel</>
                  )}
                </Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </ResponsiveDropdownMenuContent>
    </DropdownMenu>
  );
});
