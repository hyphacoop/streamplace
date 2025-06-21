import { Text, useChat, View } from "@streamplace/components";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  useWindowDimensions,
} from "react-native";
import { ChatMessageViewHydrated } from "streamplace";
import { flex, w } from "../../lib/theme/atoms";
import { RenderChatMessage } from "./chat-message";

export function Chat() {
  const chat = useChat();
  const [authors, setAuthors] = useState<
    Map<string, ChatMessageViewHydrated["chatProfile"]>
  >(new Map());
  const { width } = useWindowDimensions();
  const showTime = width > 800;

  const reversedChat = useMemo(() => {
    return chat ? [...chat].reverse() : [];
  }, [chat]);

  useEffect(() => {
    if (!chat || chat.length === 0) return;

    const uniqueAuthors = chat.reduce((acc, msg) => {
      acc.set(msg.author.did, msg.chatProfile);
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
      return <RenderChatMessage item={item} />;
    },
    [showTime],
  );

  if (!chat) return <Text>Loading chat...</Text>;

  return (
    <View style={[flex.shrink[1]]}>
      <FlatList
        style={[flex.grow[1], flex.shrink[1], w.percent[100]]}
        data={reversedChat}
        keyExtractor={keyExtractor}
        inverted
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={20}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}
