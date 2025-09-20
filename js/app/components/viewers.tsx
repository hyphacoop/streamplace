import { Text, useTheme, zero } from "@streamplace/components";
import { Eye } from "lucide-react-native";
import { View } from "react-native";

export default function Viewers({ viewers }: { viewers: number }) {
  let { theme } = useTheme();
  return (
    <View
      style={[
        { justifyContent: "center", alignItems: "center" },
        { flexDirection: "row" },
        zero.gap.all[2],
        zero.px[2],
        zero.py[1],
      ]}
    >
      <Eye size={20} color="#fd5050" />
      <Text
        style={[
          { color: "#fd5050" },
          {
            textShadowColor: "black",
            textShadowOffset: { width: -1, height: 1 },
            textShadowRadius: 3,
          },
        ]}
      >
        {new Intl.NumberFormat(undefined, { notation: "compact" }).format(
          viewers,
        )}
      </Text>
    </View>
  );
}
