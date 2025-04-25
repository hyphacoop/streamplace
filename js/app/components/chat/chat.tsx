// import { useChat, ChatMessage } from "features/player/playerSlice";
import { Settings, X } from "@tamagui/lucide-icons";
import {
  createBlockRecord,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import {
  MessageViewHydrated,
  useChat,
  usePlayerLivestream,
} from "features/player/playerSlice";
import usePlatform from "hooks/usePlatform";
import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, Linking } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button, ScrollView, Sheet, Text, useMedia, View } from "tamagui";
import { RichText } from "@atproto/api";
import { ReactElement } from "react";

export default function Chat({
  isChatVisible,
  setIsChatVisible,
}: {
  isChatVisible: boolean;
  setIsChatVisible: (visible: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [modMessage, setMessage] = useState<MessageViewHydrated | null>(null);
  const chat = useAppSelector(useChat());
  const scrollRef = useRef<ScrollView>(null);
  const livestream = useAppSelector(usePlayerLivestream());
  const userProfile = useAppSelector(selectUserProfile);
  const myStream = !!(
    userProfile &&
    livestream &&
    userProfile.did === livestream.author.did
  );
  useEffect(() => {
    if (chat) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [chat]);
  if (!chat) {
    return <></>;
  }
  const m = useMedia();
  const dispatch = useAppDispatch();
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
                    <ChatMessageText message={modMessage} chat={chat || []} />
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
}: {
  message: MessageViewHydrated;
  setOpen: (open: boolean) => void;
  setMessage: (message: MessageViewHydrated) => void;
  myStream: boolean;
}) {
  const [hover, setHover] = useState(false);
  const { isWeb } = usePlatform();
  const chat = useAppSelector(useChat());
  const moderateMessage = () => {
    if (!myStream) {
      return;
    }
    setOpen(true);
    setMessage(message);
  };
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
    >
      <ChatMessageText message={message} chat={chat || []} />
      {isWeb && myStream && (
        <View
          position="absolute"
          flexDirection="row"
          right={0}
          top={0}
          bottom={0}
          alignItems="stretch"
          justifyContent="flex-end"
        >
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
        </View>
      )}
    </View>
  );
}

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

const getRgbColor = (color?: { red: number; green: number; blue: number }) =>
  color ? `rgb(${color.red}, ${color.green}, ${color.blue})` : "$accentColor";

const RichTextMessage = ({
  text,
  facets,
  chat,
}: {
  text: string;
  facets: Facet[];
  chat: MessageViewHydrated[];
}) => {
  if (!facets?.length) return <Text>{text}</Text>;

  const parts: ReactElement[] = [];
  let lastIndex = 0;

  const sortedFacets = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  );

  sortedFacets.forEach((facet) => {
    const { byteStart: start, byteEnd: end } = facet.index;

    if (start > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</Text>,
      );
    }

    facet.features.forEach((feature) => {
      const content = text.slice(start, end);

      if (feature.$type === "app.bsky.richtext.facet#link") {
        parts.push(
          <Text
            key={`link-${start}`}
            color="$accentColor"
            cursor="pointer"
            onPress={() => Linking.openURL(feature.uri || "")}
          >
            {content}
          </Text>,
        );
      } else if (feature.$type === "app.bsky.richtext.facet#mention") {
        const mentionedUserMessage = chat.find(
          (msg) => msg.author.did === feature.did,
        );
        parts.push(
          <Text
            key={`mention-${start}`}
            color={getRgbColor(mentionedUserMessage?.chatProfile?.color)}
            cursor="pointer"
            onPress={() =>
              Linking.openURL(`https://bsky.app/profile/${feature.did || ""}`)
            }
          >
            {content}
          </Text>,
        );
      }
    });

    lastIndex = end;
  });

  if (lastIndex < text.length) {
    parts.push(<Text key={`text-${lastIndex}`}>{text.slice(lastIndex)}</Text>);
  }

  return <Text>{parts}</Text>;
};

const ChatMessageText = ({
  message,
  chat,
}: {
  message: MessageViewHydrated;
  chat: MessageViewHydrated[];
}) => {
  const rt = new RichText({ text: message.record.text });
  rt.detectFacetsWithoutResolution();

  // Process facets to add DID information for mentions
  rt.facets?.forEach((facet) => {
    facet.features.forEach((feature) => {
      if (feature.$type === "app.bsky.richtext.facet#mention") {
        const mentionText = message.record.text.slice(
          facet.index.byteStart,
          facet.index.byteEnd,
        );
        // Find the mentioned user by their handle (removing the @ symbol)
        const mentionedUser = chat.find(
          (msg) => msg.author.handle === mentionText.slice(1),
        );
        if (mentionedUser) {
          feature.did = mentionedUser.author.did;
        }
      }
    });
  });

  return (
    <Text fontSize={13}>
      <Text
        color={getRgbColor(message.chatProfile?.color)}
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
        chat={chat}
      />
    </Text>
  );
};

interface MentionSuggestion {
  did: string;
  handle: string;
  color?: {
    red: number;
    green: number;
    blue: number;
  };
}
