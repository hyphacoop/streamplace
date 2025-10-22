import { useNavigation } from "@react-navigation/native";
import { Button, Text, useTheme, zero } from "@streamplace/components";
import Loading from "components/loading/loading";
import NameColorPicker from "components/name-color-picker/name-color-picker";
import { Info, LogOut, UserRoundPen } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useStore } from "store";
import {
  useChatProfile,
  useIsReady,
  useLogin,
  useUserProfile,
} from "store/hooks";

export default function Login() {
  const { theme } = useTheme();
  const loginAction = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const openLoginLink = useStore((state) => state.openLoginLink);
  const streamplaceUrl = useStore((state) => state.url);
  const chatProfile = useChatProfile();
  const userProfile = useUserProfile();
  const loginState = useLogin();
  const [handle, setHandle] = useState("");
  const isReady = useIsReady();
  const navigation = useNavigation();

  const submit = () => {
    let clean = handle;
    if (handle.startsWith("@")) clean = handle.slice(1);
    loginAction(clean, streamplaceUrl, openLoginLink);
  };
  const onSignup = () => {
    loginAction("https://bsky.social", streamplaceUrl, openLoginLink);
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

  if (!isReady) {
    return (
      <View
        style={[
          zero.flex.values[1],
          { justifyContent: "center", alignItems: "stretch" },
          zero.gap.all[3],
        ]}
      >
        <Loading />
      </View>
    );
  }

  let rgb =
    chatProfile.profile?.color &&
    `rgb(${chatProfile.profile?.color?.red},${chatProfile.profile?.color?.green},${chatProfile.profile?.color?.blue})`;

  if (userProfile) {
    navigation.setOptions({ title: `Account` });
    return (
      <View
        style={[
          zero.flex.values[1],
          { justifyContent: "center", alignItems: "stretch" },
          zero.gap.all[3],
        ]}
      >
        <Text size="3xl" style={[{ textAlign: "center" }, zero.pb[4]]}>
          Hey,{" "}
          <Text size="3xl" style={{ color: rgb || "#bd6e86" }}>
            @{userProfile.handle}
          </Text>
          .
        </Text>
        <View
          style={[
            { flexDirection: "row" },
            zero.gap.all[2],
            { justifyContent: "center" },
          ]}
        >
          <Button
            onPress={() => logout()}
            variant="secondary"
            leftIcon={<LogOut color={theme.colors.text} />}
            style={[
              {
                maxWidth: 300,
                flexBasis: 250,
                alignItems: "center",
              },
            ]}
          >
            <Text style={[{ color: theme.colors.text, textAlign: "center" }]}>
              Log out
            </Text>
          </Button>
        </View>
        <View
          style={[
            { flexDirection: "row" },
            zero.gap.all[2],
            { justifyContent: "center" },
          ]}
        >
          {/* link to bsky.app/settings */}
          <Button
            onPress={() => {
              const u = new URL(
                "https://bsky.app/profile/" + userProfile.handle,
              );
              Linking.openURL(u.toString());
            }}
            variant="secondary"
            leftIcon={<UserRoundPen color="white" />}
            style={[
              {
                maxWidth: 300,
                flexBasis: 250,
                alignItems: "center",
              },
            ]}
          >
            <Text style={[{ color: "white", textAlign: "center" }]}>
              Edit profile (on Bluesky)
            </Text>
          </Button>
        </View>
        <NameColorPicker
          buttonProps={{
            style: {
              textAlign: "center",
              flexBasis: 250,
              maxWidth: 300,
              marginHorizontal: "auto",
            },
          }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={[
            zero.flex.values[1],
            { justifyContent: "center", alignItems: "center" },
            zero.p[4],
            { width: "100%" },
            { marginHorizontal: "auto" },
          ]}
        >
          <View
            style={[
              zero.px[8],
              zero.pt[10],
              zero.pb[6],
              zero.r.lg,
              { backgroundColor: theme.colors.card },
              { width: "100%" },
              { maxWidth: 600 },
              zero.gap.all[4],
            ]}
          >
            <Text style={[{ fontSize: 36, fontWeight: "200", color: "white" }]}>
              Log in
            </Text>
            <View
              style={[
                { flexWrap: "wrap", flexDirection: "row" },
                zero.gap.all[1],
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
            <View style={[zero.pb[2]]}>
              <Text style={[{ color: "#aaa" }]}>Handle</Text>
              <TextInput
                value={handle}
                onChangeText={(text) =>
                  setHandle(
                    text
                      .toLowerCase()
                      // copying from bsky.app often includes some RTL/LTR characters
                      .replace(/[\u202A\u202C\u200E\u200F\u2066-\u2069]/g, "")
                      .trim(),
                  )
                }
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
            </View>
            <View
              style={[
                { flexDirection: "row", justifyContent: "flex-end" },
                zero.gap.all[3],
              ]}
            >
              <Button onPress={() => onSignup()} variant="ghost">
                <Text style={[{ color: "white" }]}>Sign Up on Bluesky</Text>
              </Button>
              <Button
                onPress={submit}
                disabled={loginState.loading}
                style={[zero.px[6]]}
              >
                <Text style={[{ color: "white" }]}>
                  {loginState.loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    "Log in"
                  )}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
