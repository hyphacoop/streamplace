import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  useWindowDimensions,
} from "react-native";
import { ChatMessageViewHydrated } from "streamplace";
import { Text, useChat, View } from "../../";
import { flex, w } from "../../lib/theme/atoms";
import { RenderChatMessage } from "./chat-message";

export function Chat() {
  const chat = useChat();
  const [authors, setAuthors] = useState<Map<
    string,
    ChatMessageViewHydrated["chatProfile"]
  > | null>(null);
  const { width } = useWindowDimensions();
  const showTime = width > 800;

  const reversedChat = useMemo(() => {
    return chat ? [...chat].toReversed() : [];
  }, [chat]);

  useEffect(() => {
    if (!chat || chat.length === 0) return;
    console.log("building chat cache");

    const uniqueAuthors = chat.reduce((acc, msg) => {
      console.log(acc);
      acc.set(msg.author.handle, msg.chatProfile);
      return acc;
    }, new Map<string, ChatMessageViewHydrated["chatProfile"]>());

    setAuthors(uniqueAuthors);
  }, [chat]);

  const keyExtractor = useCallback(
    (item: ChatMessageViewHydrated, index: number) => {
      return `${item.author.handle}-${item.record.text}-${index}`;
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessageViewHydrated>) => {
      if (!authors) {
        return <Text>Loading author cache...</Text>;
      }
      return <RenderChatMessage item={item} userCache={authors} />;
    },
    [showTime, authors, chat],
  );

  if (!chat || !authors) return <Text>Loading chat...</Text>;

  return (
    <View style={[flex.shrink[1]]}>
      <FlatList
        style={[flex.grow[1], flex.shrink[1], w.percent[100]]}
        data={chat}
        inverted={true}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}
