import { Body, Button, Code, Row, View } from "@streamplace/components";
import { Redirect } from "components/aqlink";
import Loading from "components/loading/loading";
import {
    clearStreamKeyRecord,
    createStreamKeyRecord,
    selectIsReady,
    selectUserProfile,
} from "features/bluesky/blueskySlice";
import { useEffect, useState } from "react";
import { TextInput } from "react-native";
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
    <View flex={1} centered fullWidth padding="lg">
      <View fullWidth style={{ maxWidth: 600 }}>
        <FormRow>
          <Button
            variant={protocol !== "rtmp" ? "secondary" : "primary"}
            onPress={() => setProtocol("rtmp")}
          >
            RTMP
          </Button>
          <Button
            variant={protocol !== "whip" ? "secondary" : "primary"}
            onPress={() => setProtocol("whip")}
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
  const dispatch = useAppDispatch();
  const [generating, setGenerating] = useState(false);
  const [hidekey, setHidekey] = useState(true);
  const [didcopy, setDidcopy] = useState(false);
  const newKey = useAppSelector((state) => state.bluesky.newKey);

  useEffect(() => {
    if (!newKey) {
      return;
    }

    (async () => {
      try {
        await navigator.clipboard.writeText(newKey.privateKey);
        // TODO: Replace with custom toast implementation
        console.log("Bearer token copied to clipboard");
      } catch (e) {
        // not allowed. oh well.
        console.log("Could not copy to clipboard");
      }
    })();

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
      // TODO: Replace with custom toast implementation
      console.log("Bearer token copied to clipboard");
      setDidcopy(true);
    } catch (e) {
      // not allowed. oh well.
      console.log("Could not copy to clipboard");
    }
  };

  if (generating) {
    return <Loading />;
  }

  if (newKey) {

    return (
      <Row
        fullWidth
        flex={1}
        align="start"
      >
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z" />
              <path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" />
              <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
            </svg>
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
