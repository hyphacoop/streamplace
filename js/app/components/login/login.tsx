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
import { KeyboardAvoidingView } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  Button,
  Form,
  Input,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import Loading from "components/loading/loading";
import { useToastController } from "@tamagui/toast";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const dispatch = useAppDispatch();
  const chatProfile = useAppSelector(selectChatProfile);
  const userProfile = useAppSelector(selectUserProfile);
  const loginState = useAppSelector(selectLogin);
  const [handle, setHandle] = useState("");
  const isReady = useAppSelector(selectIsReady);
  const toast = useToastController();
  const navigation = useNavigation();

  const submit = () => {
    let clean = handle;
    if (handle.startsWith("@")) clean = handle.slice(1);
    dispatch(login(clean));
  };
  const onEnterPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      submit();
    }
  };

  useEffect(() => {
    if (loginState?.error) {
      toast.show("Login error", {
        message: loginState.error,
      });
    }
  }, [loginState?.error]);

  if (!isReady) {
    return (
      <View f={1} jc="center" ai="stretch" gap="$3">
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
      <View f={1} jc="center" ai="stretch" gap="$3">
        <Text textAlign="center" fontSize="$8">
          Hey, <Text color={rgb || "#bd6e86"}>@{userProfile.handle}</Text>.
        </Text>
        <View flexDirection="row" gap="$2" justifyContent="center">
          <Button
            onPress={() => dispatch(logout())}
            maxWidth={300}
            textAlign="center"
            marginHorizontal="auto"
            flexBasis={250}
          >
            Log out
          </Button>
        </View>
        <NameColorPicker
          buttonProps={{
            textAlign: "center",
            flexBasis: 250,
            maxWidth: 300,
            marginHorizontal: "auto",
          }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Form flex={1} onSubmit={submit}>
        <View
          f={1}
          jc="center"
          ai="center"
          padding="$4"
          width="100%"
          marginHorizontal="auto"
        >
          <YStack
            px="$6"
            py="$6"
            br="$4"
            backgroundColor="$color2"
            width="100%"
            maxWidth={600}
            gap="$2"
          >
            <Text fontSize="$9" fontWeight="200">
              Log in
            </Text>
            <Text color="$color11">
              Sign in using your handle on the Atmosphere (e.g. your Bluesky
              handle)
            </Text>

            <YStack gap="$2" py="$4">
              <Text htmlFor="pdsUrl" color="$color11">
                Handle
              </Text>
              <Input
                id="pdsUrl"
                value={handle}
                onChangeText={setHandle}
                backgroundColor="$color2"
                onSubmitEditing={onEnterPress}
              />
            </YStack>

            <XStack justifyContent="space-between">
              <Button
                onPress={() => navigation.navigate("Signup")}
                backgroundColor="$gray3"
                color="$color"
              >
                Sign Up
              </Button>
              <Form.Trigger asChild>
                <Button
                  px="$6"
                  // @ts-expect-error Not in the type definition but required for web.
                  type="submit"
                  backgroundColor="$accentColor"
                  disabled={loginState.loading}
                >
                  <Text>{loginState.loading ? <Spinner /> : `Log in`}</Text>
                </Button>
              </Form.Trigger>
            </XStack>
          </YStack>
        </View>
      </Form>
    </KeyboardAvoidingView>
  );
}
