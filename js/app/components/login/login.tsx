import { useNavigation } from "@react-navigation/native";
import { zero } from "@streamplace/components";
import Loading from "components/loading/loading";
import NameColorPicker from "components/name-color-picker/name-color-picker";
import {
  login,
  logout,
  selectChatProfile,
  selectIsReady,
  selectLogin,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";

export default function Login() {
  const dispatch = useAppDispatch();
  const chatProfile = useAppSelector(selectChatProfile);
  const userProfile = useAppSelector(selectUserProfile);
  const loginState = useAppSelector(selectLogin);
  const [handle, setHandle] = useState("");
  const isReady = useAppSelector(selectIsReady);
  const navigation = useNavigation();

  const submit = () => {
    let clean = handle;
    if (handle.startsWith("@")) clean = handle.slice(1);
    dispatch(login(clean));
  };
  const onSignup = () => {
    dispatch(login("https://bsky.social"));
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
        <Text style={[{ textAlign: "center", fontSize: 32 }]}>
          Hey,{" "}
          <Text style={{ color: rgb || "#bd6e86" }}>@{userProfile.handle}</Text>
          .
        </Text>
        <View
          style={[
            { flexDirection: "row" },
            zero.gap.all[2],
            { justifyContent: "center" },
          ]}
        >
          <Pressable
            onPress={() => dispatch(logout())}
            style={[
              {
                maxWidth: 300,
                backgroundColor: "#007AFF",
                padding: 12,
                borderRadius: 8,
                marginHorizontal: "auto",
                flexBasis: 250,
                alignItems: "center",
              },
            ]}
          >
            <Text style={[{ color: "white", textAlign: "center" }]}>
              Log out
            </Text>
          </Pressable>
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
              zero.px[6],
              zero.py[6],
              zero.r.lg,
              { backgroundColor: "#1a1a1a" },
              { width: "100%" },
              { maxWidth: 600 },
              zero.gap.all[2],
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
              <Text style={[{ color: "#aaa" }]}>
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
                <Text style={[{ color: "lightskyblue", fontSize: 18 }]}>
                  ℹ
                </Text>
              </Pressable>
              <Text style={[{ color: "#aaa" }]}>
                (e.g. your Bluesky handle)
              </Text>
            </View>
            <View style={[zero.gap.all[2], zero.py[4]]}>
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
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              <Pressable
                onPress={() => navigation.navigate("Signup")}
                style={[
                  {
                    backgroundColor: "#333",
                    padding: 12,
                    borderRadius: 8,
                  },
                ]}
              >
                <Text style={[{ color: "white" }]}>Sign Up on Bluesky</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={loginState.loading}
                style={[
                  zero.px[6],
                  {
                    backgroundColor: "#007AFF",
                    padding: 12,
                    borderRadius: 8,
                    opacity: loginState.loading ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[{ color: "white" }]}>
                  {loginState.loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    "Log in"
                  )}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
