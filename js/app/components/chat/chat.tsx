import { Settings, X, Reply } from "@tamagui/lucide-icons";
import {
  createBlockRecord,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import {
  MessageViewHydrated,
  useChat,
  usePlayerLivestream,
  usePlayerActions,
} from "features/player/playerSlice";
import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, Linking } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";

import {
  Button,
  isWeb,
  ScrollView,
  Sheet,
  Text,
  useMedia,
  View,
} from "tamagui";
import { RichText } from "@atproto/api";
import { ReactElement } from "react";

export default function Chat({
  isChatVisible,
  setIsChatVisible: _setIsChatVisible,
}: {
  isChatVisible: boolean;
  setIsChatVisible: (visible: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [modMessage, setMessage] = useState<MessageViewHydrated | null>(null);
  const chat = useAppSelector(useChat());
  const scrollRef = useRef<ScrollView>(null);
  const livestream = useAppSelector(usePlayerLivestream());
  const userProfile = useAppSelector(selectUserProfile) as any;
  const myStream = !!(
    userProfile &&
    livestream &&
    userProfile.did &&
    livestream.author.did &&
    userProfile.did === livestream.author.did
  );

  useEffect(() => {
    if (chat) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [chat]); //[TODO] disable scroll if user is already scrolled to previous messages

  if (!chat) {
    return <></>;
  }

  const m = useMedia();
  const dispatch = useAppDispatch();

  const replyTargets = new Set(
    chat
      .filter((msg) => msg.record.reply)
      .map((msg) => {
        const reply = msg.record.reply as {
          parent?: { uri: string };
          root?: { uri: string };
        };
        return reply?.parent?.uri || reply?.root?.uri;
      })
      .filter(Boolean),
  );

  return (
    <View f={1} position="relative">
      {isChatVisible && (
        <>
          <Sheet
            // forceRemoveScrollEnabled={open}
            open={open}
            modal={!m.gtXs}
            onOpenChange={setOpen}
            // snapPoints={snapPoints}
            // snapPointsMode={snapPointsMode}
            dismissOnSnapToBottom
            // position={position}
            // onPositionChange={setPosition}
            zIndex={100_000}
            animation="medium"
          >
            <Sheet.Overlay
              animation="lazy"
              backgroundColor="$shadow6"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Sheet.Frame>
              <View
                f={1}
                alignItems="center"
                justifyContent="center"
                padding="$4"
                gap="$5"
                backgroundColor="$accentBackground"
              >
                <Button
                  position="absolute"
                  top="$0"
                  right="$0"
                  onPress={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  marginRight={-15}
                  marginTop={-5}
                  backgroundColor="transparent"
                >
                  <X />
                </Button>
                {modMessage && (
                  <>
                    <View flexDirection="column" gap="$1">
                      <View
                        flexDirection="row"
                        alignItems="flex-start"
                        gap="$2"
                      >
                        <Text fontSize={13}>
                          <Text color="$accentColor">
                            {modMessage.author.handle
                              ? `@${modMessage.author.handle}`
                              : modMessage.author.did}
                            :
                          </Text>
                          <Text> </Text>
                          <Text>{modMessage.record.text}</Text>
                        </Text>
                      </View>
                    </View>
                    {modMessage.author.did !== userProfile?.did && (
                      <Button
                        width="100%"
                        onPress={() => {
                          setOpen(false);
                          dispatch(
                            createBlockRecord({
                              subjectDID: modMessage.author.did,
                            }),
                          );
                        }}
                      >
                        <Text>Block @{modMessage.author.handle}</Text>
                      </Button>
                    )}
                    {modMessage.author.did === userProfile?.did && (
                      <>
                        <Button width="100%" disabled={true}>
                          <Text>(You can't block yourself!)</Text>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </View>
            </Sheet.Frame>
          </Sheet>
          <ScrollView
            paddingHorizontal="$4"
            invertStickyHeaders={true}
            ref={scrollRef}
            onContentSizeChange={() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }}
            onLayout={() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {chat.map((message) => (
              <ChatMessageRow
                key={message.cid}
                message={message}
                setOpen={setOpen}
                setMessage={setMessage}
                myStream={myStream}
                isReplyTarget={replyTargets.has(message.uri)}
                replyHandle={undefined}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function ChatMessageRow({
  message,
  setMessage,
  setOpen,
  myStream,
  isReplyTarget,
  replyHandle: _replyHandle,
}: {
  message: MessageViewHydrated;
  setOpen: (open: boolean) => void;
  setMessage: (message: MessageViewHydrated) => void;
  myStream: boolean;
  isReplyTarget?: boolean;
  replyHandle?: string;
}): JSX.Element {
  const [hover, setHover] = useState(false);
  const playerActions = usePlayerActions();
  const userProfile = useAppSelector(selectUserProfile);

  const moderateMessage = () => {
    if (!myStream) {
      return;
    }
    setOpen(true);
    setMessage(message);
  };

  const handleReply = () => {
    playerActions.setReplyToMessage(message);
  };

  let hasReply = !!message.record.reply;
  let replyToHandle: string | null = null;
  let replyToText: string | null = null;
  let replyToColor = "$accentColor";

  // For the sender, we can use the direct reply info
  if (message.author.did === userProfile?.did && (message as any).replyTo) {
    hasReply = true;
    replyToHandle = (message as any).replyTo.author.handle;
    replyToText = (message as any).replyTo.text;
    if ((message as any).replyTo.chatProfile?.color) {
      const { red, green, blue } = (message as any).replyTo.chatProfile.color;
      replyToColor = `rgb(${red}, ${green}, ${blue})`;
    }
  }
  // For other users, only show the server-hydrated message which already has reply info
  else if (message.record.reply) {
    const reply = message.record.reply as {
      parent?: { uri: string; cid: string };
      root?: { uri: string; cid: string };
    };

    const parentUri = reply?.parent?.uri || reply?.root?.uri;

    if (parentUri) {
      const chat = useAppSelector(useChat());
      if (chat) {
        const parentMsg = chat.find((msg) => msg.uri === parentUri);
        if (parentMsg) {
          replyToHandle = parentMsg.author.handle;
          replyToText = parentMsg.record.text;
          if (parentMsg.chatProfile?.color) {
            const { red, green, blue } = parentMsg.chatProfile.color;
            replyToColor = `rgb(${red}, ${green}, ${blue})`;
          }
        }
      }
    }
  }

  return (
    <View
      flexDirection="row"
      display="block"
      paddingVertical={4}
      position="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      hoverStyle={{ backgroundColor: "rgba(255,255,255,0.1)" }}
      onPress={() => {
        if (!isWeb) {
          moderateMessage();
        }
      }}
      onLongPress={handleReply}
    >
      {isReplyTarget && (
        <View
          position="absolute"
          left={6}
          top={-8}
          width={2}
          height={16}
          backgroundColor="$borderColor"
          opacity={0.7}
        />
      )}
      <View flexDirection="column" gap="$1">
        {/* Reply section */}
        {hasReply && (
          <View
            flexDirection="column"
            marginBottom="$2"
            paddingLeft="$3"
            position="relative"
          >
            {/* Vertical reply line */}
            <View
              position="absolute"
              left={6}
              top={0}
              bottom={0}
              width={2}
              borderRadius={2}
              backgroundColor="$accentColor"
              opacity={0.5}
            />
            {/* Reply preview */}
            <View
              flexDirection="row"
              alignItems="center"
              gap="$1"
              paddingVertical="$1"
              paddingHorizontal="$2"
              backgroundColor="rgba(255,255,255,0.05)"
              borderRadius="$2"
              marginLeft="-$1"
            >
              <Text fontSize={12} color={replyToColor} fontWeight="bold">
                {replyToHandle ? `@${replyToHandle}` : ""}
              </Text>
              <Text
                fontSize={12}
                color="$color"
                opacity={0.7}
                numberOfLines={1}
                flex={1}
              >
                {replyToText || ""}
              </Text>
            </View>
          </View>
        )}

        {/* Message content */}
        <View flexDirection="row" alignItems="flex-start" gap="$2">
          <ChatMessageText message={message} />
        </View>
      </View>
      <View
        position="absolute"
        flexDirection="row"
        right={0}
        top={0}
        bottom={0}
        alignItems="stretch"
        justifyContent="flex-end"
        gap="$2"
      >
        {isWeb && (
          <TouchableOpacity
            style={{
              display: hover ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
            onPress={handleReply}
          >
            <Reply size={16} />
          </TouchableOpacity>
        )}
        {isWeb && myStream && (
          <TouchableOpacity
            style={{
              display: hover ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
            onPress={() => {
              moderateMessage();
            }}
          >
            <Settings size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const ChatMessageText = ({ message }: { message: MessageViewHydrated }) => {
  let color = "$accentColor";
  if (message.chatProfile?.color) {
    const { red, green, blue } = message.chatProfile.color;
    color = `rgb(${red}, ${green}, ${blue})`;
  }

  const rt = new RichText({ text: message.record.text });
  rt.detectFacetsWithoutResolution();

  return (
    <Text fontSize={13}>
      <Text
        color={color}
        cursor="pointer"
        onPress={() =>
          Linking.openURL(`https://bsky.app/profile/${message.author.did}`)
        }
      >
        {message.author.handle
          ? `@${message.author.handle}`
          : message.author.did}
        :
      </Text>
      <Text> </Text>
      <RichTextMessage
        text={message.record.text}
        facets={rt.facets as Facet[]}
      />
    </Text>
  );
};

interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
  }>;
}

const RichTextMessage = ({
  text,
  facets,
}: {
  text: string;
  facets: Facet[];
}) => {
  if (!facets || facets.length === 0) {
    return <Text>{text}</Text>;
  }

  const parts: ReactElement[] = [];
  let lastIndex = 0;

  const sortedFacets = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  );

  sortedFacets.forEach((facet) => {
    const { byteStart, byteEnd } = facet.index;
    const start = byteStart;
    const end = byteEnd;

    // Add text before the facet
    if (start > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</Text>,
      );
    }

    // Add the facet
    facet.features.forEach((feature) => {
      if (feature.$type === "app.bsky.richtext.facet#link") {
        parts.push(
          <Text
            key={`link-${start}`}
            color="$accentColor"
            cursor="pointer"
            onPress={() => Linking.openURL(feature.uri || "")}
          >
            {text.slice(start, end)}
          </Text>,
        );
      } else if (feature.$type === "app.bsky.richtext.facet#mention") {
        parts.push(
          <Text
            key={`mention-${start}`}
            color="$accentColor"
            cursor="pointer"
            onPress={() =>
              Linking.openURL(`https://bsky.app/profile/${feature.did || ""}`)
            }
          >
            {text.slice(start, end)}
          </Text>,
        );
      }
    });

    lastIndex = end;
  });

  // Add remaining text after the last facet
  if (lastIndex < text.length) {
    parts.push(<Text key={`text-${lastIndex}`}>{text.slice(lastIndex)}</Text>);
  }

  return <Text>{parts}</Text>;
};
