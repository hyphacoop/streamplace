import { useNavigation } from "@react-navigation/native";
import { Button, storage, Text, useTheme, zero } from "@streamplace/components";
import { Redirect } from "components/aqlink";
import Loading from "components/loading/loading";
import useActorTypeahead from "hooks/useActorTypeahead";
import { Info } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStore } from "store";
import { useIsReady, useLogin, useUserProfile } from "store/hooks";
import { navigateToRoute } from "../../utils/navigation";

export default function Login() {
  const { theme } = useTheme();
  const loginAction = useStore((state) => state.login);
  const openLoginLink = useStore((state) => state.openLoginLink);
  const closeLoginModal = useStore((state) => state.closeLoginModal);
  const userProfile = useUserProfile();
  const loginState = useLogin();
  const navigation = useNavigation();
  const [handle, setHandle] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isReady = useIsReady();
  const { actors, loading: typeaheadLoading } = useActorTypeahead(handle);
  // null: no return route, undefined: hasn't checked yet
  const [localReturnRoute, setLocalReturnRoute] = useState<
    | {
        name: string;
        params?: any;
      }
    | null
    | undefined
  >();

  // check for stored return route on mount
  useEffect(() => {
    storage.getItem("returnRoute").then((stored) => {
      if (stored) {
        try {
          const route = JSON.parse(stored);
          console.log("Login page - found stored returnRoute:", route);
          setLocalReturnRoute(route);
          storage.removeItem("returnRoute");
          closeLoginModal();
          navigateToRoute(navigation, route);
        } catch (e) {
          console.error("Failed to parse returnRoute from storage", e);
          setLocalReturnRoute(null);
        }
      } else {
        setLocalReturnRoute(null);
      }
    });
  }, [navigation, closeLoginModal]);

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

  if (!isReady || localReturnRoute === undefined) {
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

  if (userProfile) {
    // if return route is set, go there
    if (localReturnRoute) {
      <Redirect
        to={{ screen: localReturnRoute.name, params: localReturnRoute.params }}
      />;
    }
    return (
      <Redirect
        to={{ screen: "Settings", params: { screen: "AccountCategory" } }}
      />
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
            <View style={[zero.pb[2], { position: "relative" }]}>
              <Text style={[{ color: "#aaa" }]}>Handle</Text>
              <TextInput
                value={handle}
                onChangeText={(text) => {
                  setHandle(
                    text
                      .toLowerCase()
                      // copying from bsky.app often includes some RTL/LTR characters
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
                { flexDirection: "row", justifyContent: "flex-end" },
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
