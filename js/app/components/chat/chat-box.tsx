import { useNavigation } from "@react-navigation/native";
import { useToastController } from "@tamagui/toast";
import {
  chatMessage,
  selectIsReady,
  selectUserProfile,
  selectChatProfile,
} from "features/bluesky/blueskySlice";
import {
  LivestreamViewHydrated,
  usePlayerLivestream,
  addLocalChatMessage,
  usePlayerId,
  useReplyToMessage,
  usePlayerActions,
  prepareReplyData,
} from "features/player/playerSlice";
import {
  chatWarn,
  selectChatWarned,
} from "features/streamplace/streamplaceSlice";
import { useRef, useState, useEffect } from "react";
import { Keyboard } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button, Form, Input, isWeb, TextArea, View, Text } from "tamagui";
import {
  Palette,
  SquareArrowOutUpRight,
  X as XIcon,
} from "@tamagui/lucide-icons";
import NameColorPicker from "components/name-color-picker/name-color-picker";

export default function ChatBox({
  isPopout,
  setIsChatVisible,
  isChatVisible,
}: {
  isPopout?: boolean;
  setIsChatVisible?: (visible: boolean) => void;
  isChatVisible?: boolean;
}) {
  const [message, setMessage] = useState("");
  const isReady = useAppSelector(selectIsReady);
  const userProfile = useAppSelector(selectUserProfile);
  const chatProfile = useAppSelector(selectChatProfile);
  const chatWarned = useAppSelector(selectChatWarned);
  const loggedOut = isReady && !userProfile;
  const livestream = useAppSelector(usePlayerLivestream());
  const textAreaRef = useRef<Input>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigation();
  const playerId = usePlayerId();
  const playerActions = usePlayerActions();
  const replyTo = useAppSelector(useReplyToMessage());

  useEffect(() => {
    if (replyTo && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [replyTo]);

  const submit = () => {
    if (!isWeb) Keyboard.dismiss();
    if (!message.length || !livestream || !userProfile) return;

    const replyData = prepareReplyData(replyTo);

    // Add local message
    dispatch(
      addLocalChatMessage({
        playerId,
        message,
        replyTo: replyData,
        author: {
          did: userProfile.did,
          handle: userProfile.handle,
        },
        chatProfile: chatProfile?.profile?.color
          ? {
              color: {
                red: chatProfile.profile.color.red,
                green: chatProfile.profile.color.green,
                blue: chatProfile.profile.color.blue,
              },
            }
          : undefined,
      }),
    );

    // Send to server
    dispatch(
      chatMessage({
        text: message,
        livestream,
        replyTo: replyData,
      }),
    );

    setMessage("");
    playerActions.setReplyToMessage(null);

    if (isWeb && textAreaRef.current) {
      const textarea = textAreaRef.current as unknown as HTMLTextAreaElement;
      textarea.style.height = "";
    }
  };

  const toast = useToastController();

  return (
    <View position="relative">
      {loggedOut && (
        <View flexDirection="row" justifyContent="center">
          <Button
            backgroundColor="$accentColor"
            onPress={() => {
              navigate.navigate("Login");
            }}
          >
            Log in to chat
          </Button>
          <PopoutButton
            livestream={livestream}
            isPopout={isPopout}
            setIsChatVisible={setIsChatVisible}
          />
        </View>
      )}
      {!loggedOut && (
        <Form
          zIndex={1}
          flexDirection="column"
          padding={2}
          alignItems="stretch"
          opacity={loggedOut ? 0 : 1}
        >
          {replyTo && (
            <View
              flexDirection="row"
              alignItems="center"
              backgroundColor="$backgroundHover"
              padding="$2"
              borderRadius="$2"
              marginBottom="$2"
            >
              <View flex={1}>
                <Text fontSize={12} color="$color">
                  Replying to @{replyTo.author.handle}
                </Text>
                <Text
                  fontSize={12}
                  color="$color"
                  opacity={0.7}
                  numberOfLines={1}
                >
                  {replyTo.record.text}
                </Text>
              </View>
              <Button
                size="$2"
                circular
                onPress={() => playerActions.setReplyToMessage(null)}
                backgroundColor="transparent"
              >
                <XIcon size={16} />
              </Button>
            </View>
          )}
          <View flexGrow={1} flexShrink={0}>
            <TextArea
              borderRadius={0}
              overflow="hidden"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              value={message}
              ref={textAreaRef}
              multiline={true}
              keyboardType="default"
              disabled={Boolean(loggedOut)}
              rows={1}
              onPress={() => {
                if (!chatWarned) {
                  dispatch(chatWarn(true));
                  toast.show("Just so you know!", {
                    message: `Streamplace chat messages are public in the same way that Bluesky posts are public - they create records on your PDS.`,
                  });
                }
              }}
              onChangeText={(text) => {
                const newMessage = text.replaceAll("\n", "");
                if (newMessage.length > 300) {
                  return;
                }
                setMessage(text.replaceAll("\n", ""));
                if (isWeb && textAreaRef.current) {
                  const textarea =
                    textAreaRef.current as unknown as HTMLTextAreaElement;
                  textarea.style.height = "";
                  textarea.style.height = textarea.scrollHeight + "px";
                }
              }}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              onSubmitEditing={submit}
            />
          </View>
          <View
            flexDirection="row"
            justifyContent="flex-end"
            flexGrow={1}
            flexShrink={0}
            gap="$2"
          >
            {isChatVisible && (
              <>
                <NameColorPicker
                  buttonProps={{ backgroundColor: "transparent" }}
                  text={(color) => <Palette size={16} color={color} />}
                />
                <PopoutButton
                  livestream={livestream}
                  isPopout={isPopout}
                  setIsChatVisible={setIsChatVisible}
                />
                <Button
                  flexShrink={0}
                  backgroundColor="transparent"
                  disabled={Boolean(loggedOut)}
                  onPress={() => {
                    submit();
                  }}
                >
                  Send
                </Button>
              </>
            )}
          </View>
        </Form>
      )}
    </View>
  );
}
const PopoutButton = ({
  livestream,
  isPopout,
  setIsChatVisible,
}: {
  livestream: LivestreamViewHydrated | null;
  isPopout?: boolean;
  setIsChatVisible?: (visible: boolean) => void;
}) => {
  if (!isWeb || isPopout) {
    return <></>;
  }
  return (
    <Button
      flexShrink={0}
      backgroundColor="transparent"
      onPress={() => {
        const u = new URL(window.location.href);
        u.pathname = `/chat-popout/${livestream?.author?.did}`;
        window.open(u.toString(), "_blank", "popup=true");
        setIsChatVisible?.(false);
      }}
    >
      <SquareArrowOutUpRight size={16} />
    </Button>
  );
};
