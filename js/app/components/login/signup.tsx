import { AtpBaseClient } from "lexicons";
import NameColorPicker from "components/name-color-picker/name-color-picker";
import {
  login,
  logout,
  selectChatProfile,
  selectIsReady,
  selectLogin,
  selectPDS,
  selectUserProfile,
  setPDS,
} from "features/bluesky/blueskySlice";
import { useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Linking } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  Button,
  Form,
  H3,
  H5,
  Input,
  Label,
  Sheet,
  Spinner,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import Loading from "components/loading/loading";
import { useToastController } from "@tamagui/toast";
import { useNavigation } from "@react-navigation/native";
import {
  BadgeHelp,
  CircleHelp,
  MessageCircleQuestion,
} from "@tamagui/lucide-icons";
import AQLink from "components/aqlink";

export default function SignUp() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const userProfile = useAppSelector(selectUserProfile);
  const loginState = useAppSelector(selectLogin);
  const [open, setOpen] = useState<boolean>(false);
  const [pds, setPDS] = useState<undefined | string>();
  const isReady = useAppSelector(selectIsReady);
  const toast = useToastController();
  const navigation = useNavigation();
  const onOpenChange = (open: boolean) => {
    setOpen(open);
    Keyboard.dismiss();
  };

  const onSubmit = () => {
    let thisPds = pds;
    if (thisPds === undefined) {
      thisPds = "https://bsky.social";
    }
    dispatch(login(thisPds));
  };

  const onEnterPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      onSubmit();
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

  if (userProfile) {
    // navigate to /login
    navigation.navigate("Login");
    return (
      <View f={1} jc="center" ai="stretch" gap="$3">
        <Loading />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Form flex={1} onSubmit={onSubmit}>
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
              Sign up
            </Text>
            <Text color="$color12">
              We'll redirect you to your chosen PDS{" "}
              <CircleHelp
                size="$1"
                mb={-4}
                color="lightskyblue"
                onPress={() => {
                  const u = new URL(
                    "https://atproto.academy/docs/glossary#pds-personal-data-server",
                  );
                  Linking.openURL(u.toString());
                }}
              />{" "}
              to sign up.
            </Text>

            <YStack gap="$2" py="$4">
              <Text htmlFor="pdsUrl" color="$color11">
                PDS URL
              </Text>
              <Input
                id="pdsUrl"
                value={pds}
                onChangeText={setPDS}
                backgroundColor="$color2"
                onSubmitEditing={onEnterPress}
                defaultValue="https://bsky.social"
              />
            </YStack>

            <XStack justifyContent="space-between">
              <Button
                onPress={() => navigation.navigate("Login")}
                backgroundColor="$gray3"
                color="$color"
              >
                Log In
              </Button>
              <Form.Trigger asChild>
                <Button
                  px="$6"
                  // @ts-expect-error Not in the type definition but required for web.
                  type="submit"
                  backgroundColor="$accentColor"
                  disabled={loginState.loading}
                >
                  <Text>{loginState.loading ? <Spinner /> : `Sign up`}</Text>
                </Button>
              </Form.Trigger>
            </XStack>
          </YStack>
        </View>
      </Form>
    </KeyboardAvoidingView>
  );
}
