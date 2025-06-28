import { TriggerRef } from "@rn-primitives/dropdown-menu";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { ChatMessageViewHydrated } from "streamplace";
import { gap, mr } from "../../lib/theme/atoms";
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
  message: ChatMessageViewHydrated | null;
  onClose?: () => void;
  // onDeleteMessage?: (msg: ChatMessageViewHydrated) => void;
  // onBanUser?: (userHandle: string) => void;
};

export type ModViewRef = {
  open: () => void;
  close: () => void;
};

export const ModView = forwardRef<ModViewRef, ModViewProps>(
  ({ message, onClose }, ref) => {
    const triggerRef = useRef<TriggerRef>(null);

    let agent = usePDSAgent();
    let createBlockRecord = useCreateBlockRecord();

    if (!agent?.did) {
      <View style={[layout.flex.row, layout.flex.alignCenter, gap.all[2]]}>
        <Text>Log in to submit mod actions</Text>
      </View>;
    }

    useImperativeHandle(ref, () => ({
      open: () => triggerRef.current?.open(),
      close: () => triggerRef.current?.close(),
    }));

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
                    onDeleteMessage ? () => onDeleteMessage(message) : undefined
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
                      ? () => onBanUser(message.author.handle)
                      : undefined
                  }
                >
                  <Text color="destructive">
                    Ban user @{message.author.handle}
                  </Text>
                </DropdownMenuItem> */}
                <DropdownMenuItem
                  disabled={message.author.did === agent?.did}
                  onPress={() => createBlockRecord(message.author.handle)}
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
  },
);
