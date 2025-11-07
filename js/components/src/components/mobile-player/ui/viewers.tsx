import { Eye } from "lucide-react-native";
import * as atoms from "../../../lib/theme/atoms";
import { useViewers } from "../../../livestream-store";
import { Text, View } from "../../ui";

export function Viewers() {
  const viewers = useViewers();
  return <DehydratedViewers viewers={viewers || 0} />;
}

export function DehydratedViewers({ viewers }: { viewers: number }) {
  return (
    <View
      style={[
        atoms.layout.flex.center,
        atoms.layout.flex.row,
        atoms.gap.all[2],
        atoms.px[1],
      ]}
    >
      <Eye color="#fd5050" />
      <Text
        leading="snug"
        style={[
          { color: "#fd5050" },
          {
            textShadowColor: "black",
            textShadowRadius: 3,
            lineHeight: 24,
          },
        ]}
      >
        {new Intl.NumberFormat(undefined, { notation: "compact" }).format(
          viewers || 0,
        )}
      </Text>
    </View>
  );
}
