import { Reply, ShieldEllipsis } from "lucide-react-native";
import { ComponentProps, memo, useRef } from "react";
import { FlatList, Platform, Pressable } from "react-native";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ChatMessageViewHydrated } from "streamplace";
import {
  Text,
  useChat,
  usePlayerStore,
  useSetReplyToMessage,
  View,
} from "../../";
import { flex, py, w } from "../../lib/theme/atoms";
import { RenderChatMessage } from "./chat-message";
import { ModView } from "./mod-view";

function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 25 }],
    };
  });

  return (
    <Reanimated.View style={[styleAnimation]}>
      <Reply color="white" />
    </Reanimated.View>
  );
}

function LeftAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value - 25 }],
    };
  });

  return (
    <Reanimated.View style={[styleAnimation]}>
      <ShieldEllipsis color="white" />
    </Reanimated.View>
  );
}

const SHOWN_MSGS =
  Platform.OS === "android" || Platform.OS === "ios" ? 100 : 25;

const keyExtractor = (item: ChatMessageViewHydrated, index: number) => {
  return `${item.uri}`;
};

const ChatLine = memo(({ item }: { item: ChatMessageViewHydrated }) => {
  const setReply = useSetReplyToMessage();
  const setModMsg = usePlayerStore((state) => state.setModMessage);
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  return (
    <Pressable onLongPress={() => setModMsg(item)}>
      <Swipeable
        containerStyle={[py[1]]}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={Platform.OS === "android" ? undefined : RightAction}
        renderLeftActions={Platform.OS === "android" ? undefined : LeftAction}
        overshootFriction={9}
        ref={(ref) => {
          swipeableRef.current = ref;
        }}
        onSwipeableOpen={(r) => {
          if (r === (Platform.OS === "android" ? "right" : "left")) {
            setReply(item);
          }
          if (r === (Platform.OS === "android" ? "left" : "right")) {
            setModMsg(item);
          }
          // close this swipeable
          const swipeable = swipeableRef.current;
          if (swipeable) {
            swipeable.close();
          }
        }}
      >
        <RenderChatMessage item={item} />
      </Swipeable>
    </Pressable>
  );
});

export function Chat({
  shownMessages = SHOWN_MSGS,
  style: propsStyle,
  ...props
}: ComponentProps<typeof View> & {
  shownMessages?: number;
  style?: ComponentProps<typeof View>["style"];
}) {
  const chat = useChat();

  if (!chat)
    return (
      <View style={[flex.shrink[1]]}>
        <Text>Loading chaat...</Text>
      </View>
    );

  return (
    <View style={[flex.shrink[1]].concat(propsStyle || [])}>
      <FlatList
        style={[flex.grow[1], flex.shrink[1], w.percent[100]]}
        data={chat}
        inverted={true}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => <ChatLine item={item} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      />
      <ModView />
    </View>
  );
}
