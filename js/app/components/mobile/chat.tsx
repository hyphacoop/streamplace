import { atoms, Chat, ChatBox, View } from "@streamplace/components";
import { flex, px, py } from "@streamplace/components/src/lib/theme/atoms";
const { borderRadius, gap, layout } = atoms;

export function ChatPanel() {
  return (
    <View
      style={[
        layout.flex.column,
        flex.shrink[1],
        { width: "100%", maxWidth: "100%" },
      ]}
    >
      <Chat />
      <View style={[layout.flex.column, gap.all[2], px[4], py[2]]}>
        <ChatBox chatBoxStyle={{ borderRadius: borderRadius.xl }} />
      </View>
    </View>
  );
}
