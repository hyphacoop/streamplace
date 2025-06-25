import { atoms, Chat, View } from "@streamplace/components";
import { flex, px } from "@streamplace/components/src/lib/theme/atoms";
import ChatBox from "components/chat/chat-box";
const { borderRadius, gap, layout } = atoms;

export function ChatPanel() {
  return (
    <>
      <View style={[flex.shrink[1], px[1], { marginBottom: -6 }]}>
        <Chat />
      </View>
      <View style={[layout.flex.column, gap.all[2], px[4]]}>
        <ChatBox
          isChatVisible={true}
          chatBoxStyle={{ borderRadius: borderRadius.xl }}
        />
      </View>
    </>
  );
}
