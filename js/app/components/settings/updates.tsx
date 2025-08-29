import { Text } from "@streamplace/components";
import { View } from "react-native";
import pkg from "../../package.json";

// maybe someday some PWA update stuff will live here
export function Updates() {
  return (
    <View
      style={[
        { alignItems: "center" },
        { justifyContent: "center" },
        { paddingVertical: 24 },
      ]}
    >
      <View>
        <Text
          size="2xl"
          style={[
            {
              fontWeight: "bold",
              textAlign: "center",
              color: "#fff",
            },
          ]}
        >
          Streamplace v{pkg.version}
        </Text>
      </View>
    </View>
  );
}
