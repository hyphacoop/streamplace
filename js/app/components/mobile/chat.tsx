import { atoms, Chat, View } from "@streamplace/components";
import { flex, pl, pr, px } from "@streamplace/components/src/lib/theme/atoms";
import ChatBox from "components/chat/chat-box";
import { ComponentProps } from "react";
const { borderRadius, bottom, gap, h, layout, w, zIndex } = atoms;

type ChatPanelProps = {
  isPlayerRatioGreater: boolean;
  slideKeyboard: number;
  style?: ComponentProps<typeof View>["style"];
};

export function ChatPanel({
  isPlayerRatioGreater,
  slideKeyboard,
  style = {},
}: ChatPanelProps) {
  return (
    <View
      style={[
        isPlayerRatioGreater
          ? layout.position.relative
          : layout.position.absolute,
        h[96],
        bottom[0],
        zIndex[1],
        w.percent[100],
        pl[4],
        { transform: [{ translateY: slideKeyboard }] },
        {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: borderRadius["2xl"],
        },
      ]}
    >
      <View style={[flex.shrink[1], px[1], { marginBottom: -6 }]}>
        <Chat />
      </View>
      <View style={[layout.flex.column, gap.all[2], pr[4]]}>
        <ChatBox
          isChatVisible={true}
          chatBoxStyle={{ borderRadius: borderRadius.xl }}
        />
      </View>
    </View>
  );
}
