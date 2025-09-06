import { Text, zero } from "@streamplace/components";
import { Pressable, View } from "react-native";

export default function (props: { onRetry: () => void }) {
  return (
    <View
      style={[
        zero.flex.values[1],
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Text>Unable to contact server.</Text>
      <Pressable
        style={[
          zero.bg.primary[500],
          zero.px[4],
          zero.py[2],
          zero.r.md,
          zero.mt[2],
        ]}
        onPress={props.onRetry}
      >
        <Text style={[{ color: "white" }]}>Retry?</Text>
      </Pressable>
    </View>
  );
}
