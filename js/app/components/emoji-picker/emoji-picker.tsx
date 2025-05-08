import Picker from "@emoji-mart/react";
import { emojiEmitter } from "./emoji-emitter";
import { View } from "tamagui";
import { isWeb } from "tamagui";

export type Emoji = {
  native: string;
};

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmojiPicker({ isOpen, onClose }: EmojiPickerProps) {
  if (!isOpen) return null;

  const onEmojiSelect = (emoji: Emoji) => {
    emojiEmitter.emit("emoji-selected", emoji);
    onClose();
  };

  return (
    <View
      position="absolute"
      bottom={isWeb ? "100%" : undefined}
      left={-115}
      width={380}
      marginBottom={8}
      zIndex={1000}
    >
      <View
        {...(isWeb
          ? { onClick: onClose, style: { position: "fixed", inset: 0 } }
          : { onPress: onClose })}
      />
      <View position="relative" width="380">
        <Picker
          data={async () => {
            const res = await fetch("/emoji-data.json");
            return await res.json();
          }}
          onEmojiSelect={onEmojiSelect}
          autoFocus={true}
        />
      </View>
    </View>
  );
}
