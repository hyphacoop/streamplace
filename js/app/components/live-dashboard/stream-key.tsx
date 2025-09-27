import {
  Body,
  Button,
  Code,
  Row,
  View,
  useTheme,
  useToast,
} from "@streamplace/components";
import { Redirect } from "components/aqlink";
import Loading from "components/loading/loading";
import {
  clearStreamKeyRecord,
  createStreamKeyRecord,
  selectIsReady,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { Clipboard, ClipboardCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";

const FormRow = ({ children }: { children: React.ReactNode }) => {
  return (
    <Row fullWidth align="start">
      {children}
    </Row>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <View flex={2}>
      <Body>{children}</Body>
    </View>
  );
};

const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <View flex={6} align="stretch">
      {children}
    </View>
  );
};

export function StreamKeyScreen() {
  const [protocol, setProtocol] = useState<"whip" | "rtmp">("rtmp");
  const isReady = useAppSelector(selectIsReady);

  if (!isReady) {
    return <Loading />;
  }

  const userProfile = useAppSelector(selectUserProfile);
  if (!userProfile) {
    return <Redirect to={{ screen: "Login" }} />;
  }

  const url = useAppSelector((state) => state.streamplace.url);

  return (
    <ScrollView>
      <View flex={1} align="center" justify="start" padding="md" fullWidth>
        <View fullWidth style={{ maxWidth: 600 }}>
          <FormRow>
            <Button
              variant={protocol !== "rtmp" ? "secondary" : "primary"}
              onPress={() => setProtocol("rtmp")}
              style={{
                borderTopRightRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
            >
              RTMP
            </Button>
            <Button
              variant={protocol !== "whip" ? "secondary" : "primary"}
              onPress={() => setProtocol("whip")}
              style={{
                borderTopLeftRadius: "0px",
                borderBottomLeftRadius: "0px",
              }}
            >
              WHIP
            </Button>
          </FormRow>
          {protocol === "whip" && <WHIPDescription url={url} />}
          {protocol === "rtmp" && <RTMPDescription url={url} />}
          <FormRow>
            <Label>Output Settings</Label>
            <Content>
              <Body>
                Output mode: Advanced
                <br />
                Keyframe Interval: <Code>1s</Code>
                <br />
                x264 Options: <Code>bframes=0</Code>
              </Body>
            </Content>
          </FormRow>
        </View>
      </View>
    </ScrollView>
  );
}

export function WHIPDescription({ url }: { url: string }) {
  return (
    <>
      <FormRow>
        <Label>Service</Label>
        <Content>
          <Body>WHIP</Body>
        </Content>
      </FormRow>
      <FormRow>
        <Label>Server</Label>
        <Content>
          <TextInput
            value={url}
            readOnly={true}
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
          />
        </Content>
      </FormRow>
      <FormRow>
        <Label>Bearer Token</Label>
        <Content>
          <StreamKey />
        </Content>
      </FormRow>
    </>
  );
}

export function RTMPDescription({ url }: { url: string }) {
  const u = new URL(url);
  const rtmpUrl = `rtmps://${u.host}:1935/live`;

  return (
    <>
      <FormRow>
        <Label>Service</Label>
        <Content>
          <Body>Custom...</Body>
        </Content>
      </FormRow>
      <FormRow>
        <Label>Server</Label>
        <Content>
          <TextInput
            value={rtmpUrl}
            readOnly={true}
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
          />
        </Content>
      </FormRow>
      <FormRow>
        <Label>Stream Key</Label>
        <Content>
          <StreamKey />
        </Content>
      </FormRow>
    </>
  );
}

export default StreamKeyScreen;

export function StreamKey() {
  const theme = useTheme();
  const toast = useToast();

  const dispatch = useAppDispatch();
  const [generating, setGenerating] = useState(false);
  const [hidekey, setHidekey] = useState(true);
  const [didcopy, setDidcopy] = useState(false);
  const newKey = useAppSelector((state) => state.bluesky.newKey);

  let foregroundColor = theme.theme.colors.text || "#fff";

  useEffect(() => {
    if (!newKey) {
      return;
    }

    return () => {
      dispatch(clearStreamKeyRecord());
    };
  }, [newKey, dispatch]);

  const handleCopy = async () => {
    if (!newKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(newKey.privateKey);
      setDidcopy(true);

      toast.show("Stream Key", "Stream Key was copied to your clipboard", {
        duration: 4,
      });
    } catch (e) {
      // not allowed. oh well.
      toast.show(
        "Stream Key",
        "Failed to copy the Stream Key to your clipboard",
        { duration: 4 },
      );
    }
  };

  if (generating) {
    return <Loading />;
  }

  if (newKey) {
    return (
      <Row fullWidth flex={1} align="start">
        <TextInput
          value={newKey.privateKey}
          secureTextEntry={hidekey}
          readOnly={true}
          style={[
            {
              backgroundColor: "#1a1a1a",
              borderWidth: 1,
              borderColor: "#333",
              borderRadius: 8,
              padding: 12,
              color: "white",
              flex: 1,
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
            },
          ]}
          onFocus={(e) => {
            setHidekey(false);
          }}
          onBlur={() => {
            setHidekey(true);
          }}
          selectTextOnFocus={true}
        />
        <Button
          onPress={handleCopy}
          style={[
            {
              borderTopLeftRadius: "0px",
              borderBottomLeftRadius: "0px",
            },
          ]}
        >
          {didcopy ? (
            <ClipboardCheck color={foregroundColor} size={24} />
          ) : (
            <Clipboard color={foregroundColor} size={24} />
          )}
        </Button>
      </Row>
    );
  }

  return (
    <Button
      onPress={async () => {
        try {
          setGenerating(true);
          setDidcopy(false);
          await dispatch(createStreamKeyRecord({ store: false }));
        } catch (e) {
          console.error("failed to generate stream key", e);
        } finally {
          setGenerating(false);
        }
      }}
    >
      Generate Stream Key
    </Button>
  );
}
