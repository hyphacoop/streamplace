import { Reply } from "lucide-react-native";
import { useCallback, useMemo, useRef } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ChatMessageViewHydrated } from "streamplace";
import { Text, useChat, useSetReplyToMessage, View } from "../../";
import { bg, flex, py, w } from "../../lib/theme/atoms";
import { RenderChatMessage } from "./chat-message";

function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => {
    if (prog.value < 5 || drag.value === 0) {
      return {};
    }
    return {
      transform: [{ translateX: drag.value + 50 }],
    };
  });

  return (
    <Reanimated.View style={[styleAnimation, bg.destructive]}>
      <Reply color="white" />
    </Reanimated.View>
  );
}

export function Chat() {
  const chat = useChat();
  const { width } = useWindowDimensions();
  const setReply = useSetReplyToMessage();

  // Map to store refs for each swipeable row
  const swipeableRefs = useRef<Map<string, SwipeableMethods | null>>(new Map());

  const authors = useMemo(() => {
    if (!chat) return null;
    return chat.reduce((acc, msg) => {
      acc.set(msg.author.handle, msg.chatProfile);
      return acc;
    }, new Map<string, ChatMessageViewHydrated["chatProfile"]>());
  }, [chat]);

  const keyExtractor = useCallback(
    (item: ChatMessageViewHydrated, index: number) => {
      return `${item.author.handle}-${item.record.text}-${index}`;
    },
    [],
  );

  const renderItemAndroid = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessageViewHydrated>) => {
      if (!authors) {
        return <Text>Loading author cache...</Text>;
      }

      return (
        <Pressable onLongPress={() => setReply(item)}>
          <RenderChatMessage item={item} userCache={authors} />
        </Pressable>
      );
    },
    [authors, setReply, keyExtractor],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ChatMessageViewHydrated>) => {
      if (!authors) {
        return <Text>Loading author cache...</Text>;
      }
      const key = keyExtractor(item, index);

      return (
        <Swipeable
          containerStyle={[py[1]]}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          renderRightActions={RightAction}
          overshootFriction={9}
          ref={(ref) => {
            swipeableRefs.current.set(key, ref);
          }}
          onSwipeableOpen={(r) => {
            console.log("swipeable open", r);
            if (r === "left") {
              console.log("Setting reply");
              setReply(item);
            }
            // close this swipeable
            const swipeable = swipeableRefs.current.get(key);
            if (swipeable) {
              swipeable.close();
            }
          }}
        >
          <RenderChatMessage item={item} userCache={authors} />
        </Swipeable>
      );
    },
    [authors, setReply, keyExtractor],
  );

  if (!chat || !authors)
    return (
      <View style={[flex.shrink[1]]}>
        <Text>Loading chat...</Text>
      </View>
    );

  return (
    <View style={[flex.shrink[1]]}>
      <FlatList
        style={[flex.grow[1], flex.shrink[1], w.percent[100]]}
        data={chat.slice(0, 25)}
        inverted={true}
        keyExtractor={keyExtractor}
        renderItem={Platform.OS === "android" ? renderItemAndroid : renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}
