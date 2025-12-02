import { Button, Input, Text, useTheme, zero } from "@streamplace/components";
import useActorTypeahead from "hooks/useActorTypeahead";
import { ArrowRightToLine, AtSign, Info, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { useStore } from "store";
import { useLogin } from "store/hooks";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const { theme } = useTheme();
  const loginAction = useStore((state) => state.login);
  const openLoginLink = useStore((state) => state.openLoginLink);
  const loginState = useLogin();
  const [handle, setHandle] = useState("");
  const { actors } = useActorTypeahead(handle);

  const filteredActors = actors.filter((actor) =>
    actor.handle.startsWith(handle),
  );

  const suggestion =
    filteredActors.length > 0 &&
    handle.length >= 3 &&
    filteredActors[0].handle.startsWith(handle)
      ? filteredActors[0]
      : null;

  const completionText =
    suggestion && suggestion.handle
      ? suggestion.handle.slice(handle.length)
      : null;

  const submit = () => {
    let clean = handle;
    if (handle.startsWith("@")) clean = handle.slice(1);
    loginAction(clean, openLoginLink);
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      setHandle(suggestion.handle);
    }
  };

  const onSignup = () => {
    loginAction("https://bsky.social", openLoginLink);
  };

  const onKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      submit();
    } else if (e.nativeEvent.key === "Tab" && completionText) {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.nativeEvent.key === "ArrowRight" && completionText) {
      const input = e.target;
      if (input.selectionStart === handle.length) {
        e.preventDefault();
        acceptSuggestion();
      }
    }
  };

  useEffect(() => {
    if (loginState?.error) {
      Alert.alert("Login error", loginState.error);
    }
  }, [loginState?.error]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          zero.layout.flex[1],
          zero.layout.flex.center,
          zero.layout.flex.alignCenter,
          zero.layout.flex.justifyCenter,
          {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
          },
        ]}
      >
        <Pressable
          style={[
            zero.bg.gray[900],
            zero.r.xl,
            zero.p[6],
            { width: 600, maxWidth: "90%", maxHeight: "85%" },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              zero.layout.flex.row,
              zero.layout.flex.spaceBetween,
              zero.layout.flex.alignCenter,
              zero.mb[5],
            ]}
          >
            <Text style={[{ fontSize: 36, fontWeight: "200", color: "white" }]}>
              Log in
            </Text>
            <TouchableOpacity
              style={[zero.p[1]]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#888" size={24} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              { flexWrap: "wrap", flexDirection: "row" },
              zero.gap.all[1],
              zero.mb[4],
            ]}
          >
            <Text style={[{ color: theme.colors.textMuted }]}>
              Sign in using your handle on the AT Protocol
            </Text>
            <Pressable
              onPress={() => {
                const u = new URL(
                  "https://atproto.academy/docs/Authentication/why",
                );
                Linking.openURL(u.toString());
              }}
            >
              <Info
                size={16}
                style={{ paddingTop: 4 }}
                color={theme.colors.ring}
              />
            </Pressable>
            <Text style={[{ color: theme.colors.textMuted }]}>
              (e.g. your Bluesky handle)
            </Text>
          </View>

          <View style={[zero.mb[4], { position: "relative" }]}>
            <Text style={[{ color: "#aaa", marginBottom: 8 }]}>Handle</Text>
            <View style={{ position: "relative" }}>
              {completionText && (
                <View
                  style={[
                    {
                      position: "absolute",
                      left: 13 + 28 + 8,
                      top: 12,
                      zIndex: 1000000,
                      // clickthroughable
                      pointerEvents: "none",
                    },
                    zero.layout.flex.row,
                    zero.layout.flex.alignCenter,
                    zero.gap.all[1],
                  ]}
                >
                  <Text
                    style={[
                      {
                        color: "#555",
                        pointerEvents: "none",
                        zIndex: 1000000,
                        fontSize: 16,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        opacity: 0.2,
                        fontSize: 16,
                      }}
                    >
                      {handle}
                    </Text>
                    {completionText}
                  </Text>
                  <ArrowRightToLine
                    height={18}
                    color="#555"
                    style={{
                      paddingBottom: 1,
                    }}
                  />
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  flexDirection: "row",
                  zIndex: 32,
                  top: 8,
                }}
              >
                {suggestion?.avatar ? (
                  <Image
                    source={{ uri: suggestion.avatar }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 900,
                      opacity: suggestion.handle === handle ? 1 : 0.7,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 900,
                    }}
                  >
                    <AtSign size={28} color="#eee" />
                  </View>
                )}
              </View>
              <Input
                value={handle}
                onChangeText={(text) =>
                  setHandle(
                    text
                      .toLowerCase()
                      .replace(/[\u202A\u202C\u200E\u200F\u2066-\u2069]/g, "")
                      .trim(),
                  )
                }
                onKeyPress={onKeyPress}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholderTextColor="#666"
                containerStyle={{
                  marginLeft: 28 + 8,
                }}
              />
            </View>
          </View>

          <View
            style={[
              { flexDirection: "row", justifyContent: "flex-end", zIndex: -32 },
              zero.gap.all[3],
            ]}
          >
            <Button width="min" onPress={() => onSignup()} variant="ghost">
              <Text style={[{ color: "white" }]}>Sign Up on Bluesky</Text>
            </Button>
            <Button
              onPress={submit}
              disabled={loginState.loading}
              style={[zero.px[6]]}
              width="min"
              loading={loginState.loading}
            >
              <Text style={[{ color: "white" }]}>Log in</Text>
            </Button>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}
