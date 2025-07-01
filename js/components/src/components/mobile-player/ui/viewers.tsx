import { Eye } from "lucide-react-native";
import { Text, View } from "tamagui";
import * as atoms from "../../../lib/theme/atoms";
import { useViewers } from "../../../livestream-store";

export function Viewers() {
  const viewers = useViewers();
  return (
    <View
      style={[
        atoms.layout.flex.center,
        atoms.layout.flex.row,
        atoms.gap.all[2],
      ]}
    >
      <Eye color="#fd5050" />
      <Text
        style={{
          color: "#fd5050",
          textShadowColor: "black",
          textShadowOffset: { width: -1, height: 1 },
          textShadowRadius: 3,
          fontSize: 16,
        }}
      >
        {new Intl.NumberFormat(undefined, { notation: "compact" }).format(
          viewers || 0,
        )}
      </Text>
    </View>
  );
}
