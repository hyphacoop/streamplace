import { atoms, Chat, ChatBox, View } from "@streamplace/components";
import { flex, px, py } from "@streamplace/components/src/lib/theme/atoms";
const { borderRadius, gap, layout } = atoms;

export function ChatPanel() {
  return (
    <>
      <View style={[flex.shrink[1], px[4]]}>
        <Chat />
      </View>
      <View style={[layout.flex.column, gap.all[2], px[4], py[2]]}>
        <ChatBox chatBoxStyle={{ borderRadius: borderRadius.xl }} />
      </View>
    </>
  );
}
