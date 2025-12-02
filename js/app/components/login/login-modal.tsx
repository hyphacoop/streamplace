import { Button, Text, useTheme, zero } from "@streamplace/components";
import useActorTypeahead from "hooks/useActorTypeahead";
import { Info, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  TextInput,
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { actors, loading: typeaheadLoading } = useActorTypeahead(handle);

  const submit = () => {
    let clean = handle;
    if (handle.startsWith("@")) clean = handle.slice(1);
    setShowSuggestions(false);
    loginAction(clean, openLoginLink);
  };

  const selectActor = (actorHandle: string) => {
    setHandle(actorHandle);
    setShowSuggestions(false);
  };

  const onSignup = () => {
    loginAction("https://bsky.social", openLoginLink);
  };

  const onEnterPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      submit();
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
            <TextInput
              value={handle}
              onChangeText={(text) => {
                setHandle(
                  text
                    .toLowerCase()
                    .replace(/[\u202A\u202C\u200E\u200F\u2066-\u2069]/g, "")
                    .trim(),
                );
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              style={[
                {
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "#333",
                  borderRadius: 8,
                  padding: 12,
                  color: "white",
                },
              ]}
              onSubmitEditing={onEnterPress}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholderTextColor="#666"
            />
            {showSuggestions && actors.length > 0 && (
              <View
                style={[
                  {
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#1a1a1a",
                    borderWidth: 1,
                    borderColor: "#333",
                    borderRadius: 8,
                    marginTop: 4,
                    maxHeight: 200,
                    zIndex: 1000,
                  },
                ]}
              >
                {actors.map((actor) => (
                  <TouchableOpacity
                    key={actor.did}
                    onPress={() => selectActor(actor.handle)}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#222",
                      },
                    ]}
                  >
                    {actor.avatar && (
                      <Image
                        source={{ uri: actor.avatar }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          marginRight: 12,
                        }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      {actor.displayName && (
                        <Text style={{ color: "white", fontWeight: "500" }}>
                          {actor.displayName}
                        </Text>
                      )}
                      <Text style={{ color: "#888", fontSize: 12 }}>
                        @{actor.handle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
