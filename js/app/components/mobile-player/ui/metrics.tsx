import { Text, View } from "@streamplace/components/src/components/ui";
import { pt } from "@streamplace/components/src/lib/theme/atoms";
import { AlertCircle, CircleCheck, CircleX } from "lucide-react-native";

type MetricsPanelProps = {
  connectionQuality: "good" | "degraded" | "bad" | string;
  segmentDeltas: number[];
  mean: number;
  range: number;
};

export function MetricsPanel({
  connectionQuality,
  segmentDeltas,
  mean,
  range,
}: MetricsPanelProps) {
  let icon = <CircleX color="#d44" />;
  let color = "#d44";
  if (connectionQuality === "good") {
    icon = <CircleCheck color="#4d4" />;
    color = "#4d4";
  } else if (connectionQuality === "degraded") {
    icon = <AlertCircle color="#aa4" />;
    color = "#aa4";
  } else {
    icon = <CircleX color="#d44" />;
    color = "#d44";
  }

  return (
    <View
      style={{
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: 8,
          gap: 4,
        }}
      >
        {icon}
        <Text
          style={[
            pt[0],
            {
              color,
            },
          ]}
        >
          {connectionQuality.toUpperCase()}
        </Text>
      </View>
      {/* <View>
        <Text>
          last Δ:{" "}
          {segmentDeltas.length > 0
            ? segmentDeltas[segmentDeltas.length - 1]
            : "—"}
        </Text>
        <Text>mean: {mean}</Text>
        <Text>range: {range}</Text>
      </View> */}
    </View>
  );
}
