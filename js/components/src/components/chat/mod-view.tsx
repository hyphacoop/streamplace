import { TriggerRef } from "@rn-primitives/dropdown-menu";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { ChatMessageViewHydrated } from "streamplace";
import { mr } from "../../lib/theme/atoms";
import {
  colors,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  onDeleteMessage?: (msg: ChatMessageViewHydrated) => void;
  onBanUser?: (userHandle: string) => void;
};

export type ModViewRef = {
  open: () => void;
  close: () => void;
};

export const ModView = forwardRef<ModViewRef, ModViewProps>(
  ({ message, onClose, onDeleteMessage, onBanUser }, ref) => {
    const triggerRef = useRef<TriggerRef>(null);

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
                <DropdownMenuItem
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
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </ResponsiveDropdownMenuContent>
      </DropdownMenu>
    );
  },
);
