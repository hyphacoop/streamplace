import { Button } from "@streamplace/components";
import {
  createChatProfileRecord,
  getChatProfileRecordFromPDS,
  selectChatProfile,
  selectUserProfile,
} from "features/bluesky/blueskySlice";
import { SwatchBook } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
  Swatches,
} from "reanimated-color-picker";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { PlaceStreamChatProfile } from "streamplace";

/**
 * Parses an RGB color string and returns an object with red, green, and blue values
 * @param rgbString - RGB color string in the format "rgb(r,g,b)" or "rgba(r,g,b,a)"
 * @returns An object containing red, green, and blue values as numbers
 */
function parseRgbString(rgbString: string): PlaceStreamChatProfile.Color {
  // Check if the string is empty or not in the expected format
  if (
    !rgbString ||
    (!rgbString.startsWith("rgb(") && !rgbString.startsWith("rgba("))
  ) {
    throw new Error("Invalid color string (not rgb or rgba)");
  }
  // Extract the numbers from the string
  const numbersString = rgbString.replace(/^rgba?\(|\)$/g, "");
  const parts = numbersString.split(",");

  // Make sure we have at least 3 parts for r, g, b
  if (parts.length < 3) {
    throw new Error("Invalid color string (not enough parts)");
  }

  return {
    red: parseInt(parts[0].trim(), 10),
    green: parseInt(parts[1].trim(), 10),
    blue: parseInt(parts[2].trim(), 10),
  };
}

export default function NameColorPicker({
  children,
  text,
  buttonProps,
}: {
  children?: React.ReactNode;
  text?: (color: string) => React.ReactNode;
  buttonProps?: any;
}) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const chatProfile = useAppSelector(selectChatProfile);
  const [color, setColor] = useState("#bd6e86");
  const profile = useAppSelector(selectUserProfile);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (profile?.did && !chatProfile?.profile) {
      dispatch(getChatProfileRecordFromPDS());
    }
    if (chatProfile?.profile && chatProfile?.profile.color) {
      const { red, green, blue } = chatProfile.profile.color;
      setColor(`rgb(${red}, ${green}, ${blue})`);
    }
  }, [profile?.did, chatProfile?.profile?.color]);

  return (
    <View style={[{ alignItems: "center" }, { flexDirection: "row" }]}>
      <Button
        variant="secondary"
        leftIcon={<SwatchBook color={color} />}
        style={[buttonProps?.style]}
        onPress={() => {
          if (!isWeb) {
            Keyboard.dismiss();
          }
          setOpen(true);
        }}
        {...buttonProps}
      >
        <Text style={[{ color, fontWeight: "600" }]}>
          {text ? text(color) : "Change Name Color"}
        </Text>
      </Button>

      <Modal
        visible={open}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpen(false);
          dispatch(getChatProfileRecordFromPDS());
        }}
      >
        <View
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <View
            style={[
              {
                backgroundColor: "#1a1a1a",
                borderRadius: 16,
                padding: 16,
                paddingBottom: 300,
                gap: 20,
                maxWidth: 600,
                width: "90%",
                alignItems: "stretch",
                justifyContent: "center",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: "absolute",
                  top: 0,
                  right: 0,
                  marginRight: -15,
                  marginTop: 5,
                  backgroundColor: "transparent",
                  padding: 8,
                  zIndex: 1,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              <Text style={[{ fontSize: 24, color: "#fff" }]}>×</Text>
            </TouchableOpacity>

            <Text
              style={[
                {
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                  color,
                },
              ]}
            >
              @{profile?.handle}
            </Text>

            <ColorPicker value={color} onCompleteJS={(x) => setColor(x.rgb)}>
              <Preview />
              <Panel1 />
              <HueSlider />
              <Swatches style={{ margin: 10 }} />
            </ColorPicker>

            <TouchableOpacity
              style={[
                {
                  backgroundColor: "#bd6e86",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                },
              ]}
              onPress={() => {
                setOpen(false);
                dispatch(createChatProfileRecord(parseRgbString(color)));
              }}
            >
              <Text style={[{ color: "#fff", fontWeight: "600" }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
